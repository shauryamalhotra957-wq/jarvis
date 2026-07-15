export const WAKE_WORD = "jarvis";

export const DEFAULT_WAKE_STATE = Object.freeze({
  armed: false,
  awake: false,
  awaitingCommand: false,
  command: ""
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseWakePhrase(transcript, wakeWord = WAKE_WORD) {
  const text = String(transcript || "").replace(/\s+/g, " ").trim();
  const phrase = escapeRegExp(String(wakeWord || WAKE_WORD).trim());
  const match = new RegExp(`(?:^|\\b)(?:hey\\s+|okay\\s+|ok\\s+)?${phrase}\\b`, "i").exec(text);
  if (!match) return { detected: false, command: "", transcript: text };
  const command = text
    .slice(match.index + match[0].length)
    .replace(/^[\s,.:;!?-]+/, "")
    .trim();
  return { detected: true, command, transcript: text };
}

export function reduceWakeState(state = DEFAULT_WAKE_STATE, event = {}) {
  switch (event.type) {
    case "ARM":
      return { ...DEFAULT_WAKE_STATE, armed: true };
    case "DISARM":
      return { ...DEFAULT_WAKE_STATE };
    case "SLEEP":
      return { ...state, awake: false, awaitingCommand: false, command: "" };
    case "HEARD": {
      if (!state.armed) return { ...state, command: "" };
      const phrase = parseWakePhrase(event.transcript, event.wakeWord);
      if (phrase.detected) {
        return {
          ...state,
          awake: true,
          awaitingCommand: !phrase.command,
          command: phrase.command
        };
      }
      if (state.awaitingCommand && phrase.transcript) {
        return {
          ...state,
          awake: true,
          awaitingCommand: false,
          command: phrase.transcript
        };
      }
      return { ...state, command: "" };
    }
    default:
      return { ...state, command: "" };
  }
}
