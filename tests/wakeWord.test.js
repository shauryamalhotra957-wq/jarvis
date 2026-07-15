import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_WAKE_STATE, parseWakePhrase, reduceWakeState } from "../src/core/wakeWord.js";

test("parseWakePhrase detects direct and conversational wake phrases", () => {
  assert.deepEqual(parseWakePhrase("Jarvis"), {
    detected: true,
    command: "",
    transcript: "Jarvis"
  });
  assert.equal(parseWakePhrase("Hey Jarvis, show me Tokyo").command, "show me Tokyo");
  assert.equal(parseWakePhrase("okay jarvis scan the pacific").command, "scan the pacific");
});

test("parseWakePhrase rejects words that only contain the wake word", () => {
  assert.equal(parseWakePhrase("jarvisian protocol").detected, false);
  assert.equal(parseWakePhrase("show Tokyo").detected, false);
});

test("wake state ignores speech until armed", () => {
  const state = reduceWakeState(DEFAULT_WAKE_STATE, { type: "HEARD", transcript: "Jarvis" });
  assert.deepEqual(state, DEFAULT_WAKE_STATE);
});

test("wake state supports a wake phrase followed by a separate command", () => {
  const armed = reduceWakeState(DEFAULT_WAKE_STATE, { type: "ARM" });
  const awake = reduceWakeState(armed, { type: "HEARD", transcript: "Jarvis" });
  assert.equal(awake.awaitingCommand, true);
  const commanded = reduceWakeState(awake, { type: "HEARD", transcript: "show Delhi climate risk" });
  assert.equal(commanded.command, "show Delhi climate risk");
  assert.equal(commanded.awaitingCommand, false);
});

test("wake state extracts commands spoken in the activation phrase", () => {
  const armed = reduceWakeState(DEFAULT_WAKE_STATE, { type: "ARM" });
  const state = reduceWakeState(armed, { type: "HEARD", transcript: "Jarvis track the ISS" });
  assert.equal(state.command, "track the ISS");
  assert.equal(state.awake, true);
});
