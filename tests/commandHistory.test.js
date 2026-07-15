import test from "node:test";
import assert from "node:assert/strict";
import {
  COMMAND_HISTORY_KEY,
  addCommand,
  loadCommandHistory,
  saveCommandHistory
} from "../src/core/commandHistory.js";

function memoryStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) {
      assert.equal(key, COMMAND_HISTORY_KEY);
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, COMMAND_HISTORY_KEY);
      value = nextValue;
    }
  };
}

test("addCommand trims, deduplicates, and limits command memory", () => {
  let history = ["Tokyo scan", "Delhi climate", "Global sweep", "London cyber"];
  history = addCommand(history, "  delhi   climate  ");
  assert.deepEqual(history, ["delhi climate", "Tokyo scan", "Global sweep", "London cyber"]);
  assert.equal(history.length, 4);
});

test("command history round-trips through storage", () => {
  const storage = memoryStorage();
  const history = ["Tokyo scan", "Delhi climate"];
  assert.equal(saveCommandHistory(storage, history), true);
  assert.deepEqual(loadCommandHistory(storage), history);
});

test("loadCommandHistory falls back when storage is unavailable or invalid", () => {
  assert.deepEqual(loadCommandHistory(null, ["standby"]), ["standby"]);
  assert.deepEqual(loadCommandHistory(memoryStorage("not-json"), ["standby"]), ["standby"]);
});
