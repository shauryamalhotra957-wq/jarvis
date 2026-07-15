export const COMMAND_HISTORY_KEY = "jarvis.command-history.v1";
export const COMMAND_HISTORY_LIMIT = 4;

export function addCommand(history, command, limit = COMMAND_HISTORY_LIMIT) {
  const value = String(command || "").replace(/\s+/g, " ").trim();
  if (!value) return [...history].slice(0, limit);
  const identity = value.toLocaleLowerCase();
  return [
    value,
    ...history.filter((item) => String(item).toLocaleLowerCase() !== identity)
  ].slice(0, limit);
}

export function loadCommandHistory(storage, fallback = []) {
  try {
    const stored = JSON.parse(storage?.getItem(COMMAND_HISTORY_KEY) || "[]");
    if (!Array.isArray(stored)) return [...fallback];
    const history = stored
      .filter((item) => typeof item === "string")
      .reduceRight((items, item) => addCommand(items, item), []);
    return history.length ? history : [...fallback];
  } catch {
    return [...fallback];
  }
}

export function saveCommandHistory(storage, history) {
  try {
    storage?.setItem(COMMAND_HISTORY_KEY, JSON.stringify(history.slice(0, COMMAND_HISTORY_LIMIT)));
    return Boolean(storage);
  } catch {
    return false;
  }
}
