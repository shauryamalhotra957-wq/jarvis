import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createJarvisServer, createWakeHub } from "../desktop/server.mjs";

test("wake hub connects, broadcasts, and disconnects clients", () => {
  const writes = [];
  const client = { write: (value) => writes.push(value), end: () => writes.push("ended") };
  const hub = createWakeHub();
  const remove = hub.add(client);
  assert.equal(hub.size, 1);
  assert.equal(hub.broadcast({ source: "test" }), 1);
  assert.match(writes.join(""), /event: wake/);
  assert.match(writes.join(""), /"source":"test"/);
  remove();
  assert.equal(hub.size, 0);
});

test("desktop server exposes health, wake, and static app routes", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "jarvis-desktop-"));
  await writeFile(join(root, "index.html"), "<!doctype html><title>JARVIS test</title>");
  const { server } = createJarvisServer({ root });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${base}/api/health`).then((response) => response.json());
  assert.equal(health.status, "ok");

  const wake = await fetch(`${base}/api/wake`, { method: "POST" });
  assert.equal(wake.status, 202);
  assert.equal((await wake.json()).status, "accepted");

  const blockedWake = await fetch(`${base}/api/wake`, {
    method: "POST",
    headers: {
      Origin: "https://untrusted.example",
      "Sec-Fetch-Site": "cross-site"
    }
  });
  assert.equal(blockedWake.status, 403);
  assert.equal((await blockedWake.json()).error, "untrusted_origin");

  const sameOriginWake = await fetch(`${base}/api/wake`, {
    method: "POST",
    headers: { Origin: base }
  });
  assert.equal(sameOriginWake.status, 202);

  const app = await fetch(`${base}/mission/brief`).then((response) => response.text());
  assert.match(app, /JARVIS test/);
});
