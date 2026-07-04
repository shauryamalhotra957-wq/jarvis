import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const main = readFileSync("src/main.js", "utf8");
const globe = readFileSync("src/globe.js", "utf8");
const styles = readFileSync("src/styles.css", "utf8");

test("premium interface controls are present", () => {
  assert.match(html, /id="systemStream"/);
  assert.match(html, /id="scanProgress"/);
  assert.match(html, /data-mode="earth"/);
  assert.match(html, /data-mode="night"/);
  assert.match(html, /data-mode="tactical"/);
});

test("visual modes are wired into the globe renderer", () => {
  assert.match(main, /setVisualMode\(mode\)/);
  assert.match(globe, /setVisualMode\(mode\)/);
  assert.match(globe, /displayMode/);
});

test("motion-heavy interface has a reduced-motion path", () => {
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /scanSweep/);
});
