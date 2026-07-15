export const PERSONAL_MEMORY_KEY = "jarvis.personal-memory.v1";
export const PERSONAL_MEMORY_LIMIT = 12;

function cleanNote(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 240);
}

export function addMemoryNote(memory, note, createdAt = new Date().toISOString()) {
  const value = cleanNote(note);
  if (!value) return [...memory].slice(0, PERSONAL_MEMORY_LIMIT);
  const identity = value.toLocaleLowerCase();
  return [
    { value, createdAt },
    ...memory.filter((item) => cleanNote(item?.value).toLocaleLowerCase() !== identity)
  ].slice(0, PERSONAL_MEMORY_LIMIT);
}

export function loadPersonalMemory(storage) {
  try {
    const stored = JSON.parse(storage?.getItem(PERSONAL_MEMORY_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored
      .filter((item) => item && typeof item.value === "string")
      .reduceRight(
        (items, item) => addMemoryNote(items, item.value, item.createdAt || new Date(0).toISOString()),
        []
      );
  } catch {
    return [];
  }
}

export function savePersonalMemory(storage, memory) {
  try {
    storage?.setItem(PERSONAL_MEMORY_KEY, JSON.stringify(memory.slice(0, PERSONAL_MEMORY_LIMIT)));
    return Boolean(storage);
  } catch {
    return false;
  }
}

function personalAnswer({ title, summary, sections, actions = [], mode = "personal", confidence = 96, mutation = null }) {
  return {
    title,
    summary,
    confidence,
    globeFocus: null,
    sections,
    actions,
    mode,
    mutation
  };
}

function formatTime(now) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(now);
}

function formatDate(now) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(now);
}

function memorySummary(memory) {
  return memory.length
    ? memory.slice(0, 5).map((item, index) => `${index + 1}. ${item.value}`).join(" ")
    : "No personal notes are stored yet. Say: Jarvis, remember that my priority is the vehicle HMI prototype.";
}

export function routePersonalCommand(query, options = {}) {
  const text = String(query || "").replace(/\s+/g, " ").trim();
  const normalized = text.toLocaleLowerCase();
  const now = options.now || new Date();
  const memory = options.memory || [];
  const remember = text.match(/^(?:please\s+)?remember(?:\s+that)?\s+(.+)/i);

  if (remember) {
    const note = cleanNote(remember[1]);
    if (!note) return null;
    return personalAnswer({
      title: "Memory encoded",
      summary: `I will keep this on this device: ${note}`,
      sections: [
        { heading: "Local memory", body: note },
        { heading: "Privacy", body: "This note stays in local browser storage and is never sent by this prototype." }
      ],
      actions: ["Review personal memory", "Use memory in the daily brief"],
      mode: "memory",
      mutation: { type: "remember", value: note }
    });
  }

  if (/\b(what do you remember|recall (?:my )?(?:memory|notes)|show (?:my )?(?:memory|notes))\b/i.test(normalized)) {
    return personalAnswer({
      title: "Personal memory",
      summary: memorySummary(memory),
      sections: [
        { heading: "Stored locally", body: `${memory.length} origin-scoped browser note${memory.length === 1 ? "" : "s"} available.` },
        { heading: "Recent context", body: memorySummary(memory) }
      ],
      actions: ["Add another memory", "Run daily brief"],
      mode: "memory"
    });
  }

  if (/\b(daily brief|morning brief|brief me|today'?s brief)\b/i.test(normalized)) {
    return personalAnswer({
      title: "Daily intelligence brief",
      summary: `${formatDate(now)}. Local time ${formatTime(now)}. ${memory.length} personal context item${memory.length === 1 ? " is" : "s are"} ready.`,
      sections: [
        { heading: "Temporal context", body: `${formatDate(now)} at ${formatTime(now)}.` },
        { heading: "Priority memory", body: memorySummary(memory) },
        { heading: "Suggested focus", body: memory[0]?.value || "Define the single outcome that would make today successful." }
      ],
      actions: ["Focus the top priority", "Review global signals", "Add calendar and task connectors"],
      mode: "brief"
    });
  }

  if (/\b(what time|current time|time is it)\b/i.test(normalized)) {
    return personalAnswer({
      title: "Local time",
      summary: `It is ${formatTime(now)}.`,
      sections: [{ heading: "System clock", body: `${formatDate(now)}, ${formatTime(now)}.` }],
      actions: ["Run daily brief"],
      mode: "time",
      confidence: 100
    });
  }

  if (/\b(what(?:'s| is) the date|today'?s date|what day is it)\b/i.test(normalized)) {
    return personalAnswer({
      title: "Calendar date",
      summary: `Today is ${formatDate(now)}.`,
      sections: [{ heading: "Calendar", body: formatDate(now) }],
      actions: ["Run daily brief"],
      mode: "date",
      confidence: 100
    });
  }

  if (/\b(system status|diagnostic|diagnostics|status report)\b/i.test(normalized)) {
    return personalAnswer({
      title: "All core systems nominal",
      summary: "Command routing, local memory, globe telemetry, voice output, and wake-word control are online where supported by this browser.",
      sections: [
        { heading: "Local intelligence", body: "Deterministic command and personal-memory routes are available without an API key." },
        { heading: "Voice channel", body: "Browser speech recognition requires microphone permission and may use the browser vendor's recognition service." },
        { heading: "Desktop path", body: "The optional openWakeWord companion provides a local always-listening activation path outside the browser." }
      ],
      actions: ["Arm wake word", "Run global scan", "Review privacy posture"],
      mode: "diagnostic"
    });
  }

  return null;
}
