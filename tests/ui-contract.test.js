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

test("Earth textures respect the configured deployment base", () => {
  assert.match(globe, /import\.meta\.env\.BASE_URL/);
  assert.match(globe, /resolvePublicAsset/);
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

test("speech controls handle unavailable and repeated interactions", () => {
  assert.match(main, /elements\.speakButton\.disabled = true/);
  assert.match(main, /function toggleSpeechRecognition/);
  assert.match(main, /appState\.recognition\.stop\(\)/);
  assert.match(main, /speechSynthesis\.cancel\(\)/);
  assert.match(main, /VOICE ERROR/);
});

test("wake portal exposes manual and voice activation paths", () => {
  assert.match(html, /id="wakePortal"/);
  assert.match(html, /id="portalArmButton"/);
  assert.match(html, /id="portalEnterButton"/);
  assert.match(html, /id="wakeButton"[^>]*aria-pressed="false"/);
  assert.match(main, /reduceWakeState/);
  assert.match(main, /startRecognition\("wake"\)/);
  assert.match(styles, /body\.jarvis-dormant \.wake-portal/);
  assert.match(styles, /body\.jarvis-awake \.cockpit/);
});

test("personal intelligence and privacy state are visible in the HUD", () => {
  assert.match(html, /id="privacyState"/);
  assert.match(html, /id="memoryCount"/);
  assert.match(html, /id="localClock"/);
  assert.match(main, /routePersonalCommand/);
  assert.match(main, /savePersonalMemory/);
  assert.match(styles, /\.privacy-strip/);
  assert.match(styles, /\.action-ribbon/);
});

test("desktop wake bridge can foreground the dormant interface", () => {
  assert.match(main, /new EventSource\("\/api\/wake\/events"\)/);
  assert.match(main, /activateDesktopWake/);
  assert.match(main, /parameters\.get\("desktop"\) !== "1"/);
  assert.match(main, /DESKTOP WAKE READY/);
});
