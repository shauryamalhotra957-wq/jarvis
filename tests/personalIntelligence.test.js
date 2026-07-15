import test from "node:test";
import assert from "node:assert/strict";
import {
  PERSONAL_MEMORY_KEY,
  addMemoryNote,
  loadPersonalMemory,
  routePersonalCommand,
  savePersonalMemory
} from "../src/core/personalIntelligence.js";

function memoryStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) {
      assert.equal(key, PERSONAL_MEMORY_KEY);
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, PERSONAL_MEMORY_KEY);
      value = nextValue;
    }
  };
}

test("personal memory trims, deduplicates, and round-trips safely", () => {
  let memory = addMemoryNote([], "  Finish   vehicle HMI prototype ", "2026-07-15T00:00:00.000Z");
  memory = addMemoryNote(memory, "finish vehicle hmi prototype", "2026-07-15T01:00:00.000Z");
  assert.equal(memory.length, 1);
  assert.equal(memory[0].value, "finish vehicle hmi prototype");
  const storage = memoryStorage();
  assert.equal(savePersonalMemory(storage, memory), true);
  assert.deepEqual(loadPersonalMemory(storage), memory);
});

test("remember commands return an explicit local mutation", () => {
  const answer = routePersonalCommand("remember that the HMI demo is Friday");
  assert.equal(answer.mode, "memory");
  assert.deepEqual(answer.mutation, { type: "remember", value: "the HMI demo is Friday" });
  assert.match(answer.sections[1].body, /local browser storage/i);
});

test("daily brief combines time and personal context", () => {
  const now = new Date("2026-07-15T09:15:00");
  const memory = [{ value: "Ship the Jarvis wake flow", createdAt: now.toISOString() }];
  const answer = routePersonalCommand("Jarvis daily brief", { now, memory });
  assert.equal(answer.mode, "brief");
  assert.match(answer.summary, /July 15, 2026/);
  assert.match(answer.sections[1].body, /Ship the Jarvis wake flow/);
});

test("personal router handles clock and diagnostic actions", () => {
  const now = new Date("2026-07-15T09:15:00");
  assert.equal(routePersonalCommand("what time is it", { now }).mode, "time");
  assert.equal(routePersonalCommand("run system diagnostics", { now }).mode, "diagnostic");
  assert.equal(routePersonalCommand("show Tokyo satellite intelligence", { now }), null);
});
