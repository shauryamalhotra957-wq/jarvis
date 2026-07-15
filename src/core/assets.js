export function resolvePublicAsset(path, baseUrl = "/") {
  const base = String(baseUrl || "/").replace(/\/*$/, "/");
  const assetPath = String(path || "").replace(/^\/+/, "");
  return `${base}${assetPath}`;
}
