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
  assert.match(main, /appState\.motionReduced/);
  assert.match(globe, /this\.motionReduced/);
  assert.match(globe, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /scanSweep/);
});

test("toggle controls expose pressed state to assistive tech", () => {
  assert.match(html, /id="speakButton"[^>]*aria-pressed="true"/);
  assert.match(html, /data-mode="earth"[^>]*aria-pressed="true"/);
  assert.match(html, /data-mode="night"[^>]*aria-pressed="false"/);
  assert.match(main, /setAttribute\("aria-pressed", String\(appState\.voiceEnabled\)\)/);
  assert.match(main, /setAttribute\("aria-pressed", String\(active\)\)/);
});

test("dynamic status regions announce command updates", () => {
  assert.match(html, /id="scanStatus"[^>]*aria-live="polite"/);
  assert.match(html, /id="systemStream"[^>]*aria-live="polite"/);
  assert.match(html, /id="systemStream"[^>]*aria-relevant="additions text"/);
});

test("command memory is restored and persisted locally", () => {
  assert.match(main, /loadCommandHistory\(storage/);
  assert.match(main, /saveCommandHistory\(storage/);
  assert.match(main, /elements\.input\.value = appState\.lastCommand/);
});
