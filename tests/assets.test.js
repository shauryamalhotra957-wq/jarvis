import test from "node:test";
import assert from "node:assert/strict";
import { resolvePublicAsset } from "../src/core/assets.js";

test("resolvePublicAsset respects root and nested deployment bases", () => {
  assert.equal(resolvePublicAsset("assets/earth.jpg", "/"), "/assets/earth.jpg");
  assert.equal(resolvePublicAsset("/assets/earth.jpg", "/jarvis/"), "/jarvis/assets/earth.jpg");
  assert.equal(
    resolvePublicAsset("assets/earth.jpg", "https://cdn.example.com/jarvis"),
    "https://cdn.example.com/jarvis/assets/earth.jpg"
  );
});
