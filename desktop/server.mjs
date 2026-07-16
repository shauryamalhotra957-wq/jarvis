import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

export function createWakeHub() {
  const clients = new Set();
  return {
    add(client) {
      clients.add(client);
      client.write("event: ready\ndata: {\"status\":\"connected\"}\n\n");
      return () => clients.delete(client);
    },
    broadcast(payload = {}) {
      const message = `event: wake\ndata: ${JSON.stringify(payload)}\n\n`;
      for (const client of clients) client.write(message);
      return clients.size;
    },
    close() {
      for (const client of clients) client.end();
      clients.clear();
    },
    get size() {
      return clients.size;
    }
  };
}

function safeAssetPath(root, pathname) {
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidate = resolve(root, normalize(requested));
  return candidate === root || candidate.startsWith(`${root}\\`) || candidate.startsWith(`${root}/`)
    ? candidate
    : null;
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(value));
}

export function isTrustedWakeRequest(request) {
  const fetchSite = String(request.headers["sec-fetch-site"] || "").toLowerCase();
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.origin;
  if (!origin) return true;

  try {
    const parsed = new URL(origin);
    const host = String(request.headers.host || "").trim().toLowerCase();
    return ["http:", "https:"].includes(parsed.protocol) && Boolean(host) && parsed.host.toLowerCase() === host;
  } catch {
    return false;
  }
}

export function createJarvisServer(options = {}) {
  const root = resolve(options.root || join(fileURLToPath(new URL("..", import.meta.url)), "dist"));
  const hub = options.hub || createWakeHub();
  const server = createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");

    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { status: "ok", clients: hub.size });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/wake/events") {
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      });
      const remove = hub.add(response);
      request.on("close", remove);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/wake") {
      if (!isTrustedWakeRequest(request)) {
        sendJson(response, 403, { error: "untrusted_origin" });
        return;
      }
      const delivered = hub.broadcast({ source: "desktop", at: new Date().toISOString() });
      sendJson(response, 202, { status: "accepted", delivered });
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "method_not_allowed" });
      return;
    }

    let filePath = safeAssetPath(root, url.pathname);
    if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
      filePath = join(root, "index.html");
    }
    if (!existsSync(filePath)) {
      sendJson(response, 503, { error: "build_missing", hint: "Run npm run build first." });
      return;
    }

    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; media-src 'self' blob:"
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath).pipe(response);
  });

  server.on("close", () => hub.close());
  return { server, hub, root };
}

function readArgument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(readArgument("--port", process.env.JARVIS_PORT || 4374));
  const host = readArgument("--host", "127.0.0.1");
  const root = readArgument("--root", undefined);
  const { server } = createJarvisServer({ root });
  server.listen(port, host, () => {
    console.log(`JARVIS desktop bridge online at http://${host}:${port}`);
  });
}
