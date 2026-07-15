import "./styles.css";
import { answerQuery, bootAnswer } from "./core/assistantCore.js";
import { addCommand, loadCommandHistory, saveCommandHistory } from "./core/commandHistory.js";
import {
  addMemoryNote,
  loadPersonalMemory,
  routePersonalCommand,
  savePersonalMemory
} from "./core/personalIntelligence.js";
import { DEFAULT_WAKE_STATE, reduceWakeState } from "./core/wakeWord.js";
import { startupSignals } from "./data/worldIntel.js";
import { JarvisGlobe } from "./globe.js";

const DEFAULT_COMMAND = "show me satellite intel over Tokyo";
const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();
const initialCommandHistory = loadCommandHistory(storage, [DEFAULT_COMMAND]);
const initialPersonalMemory = loadPersonalMemory(storage);

const elements = {
  mount: document.querySelector("#globeMount"),
  tooltip: document.querySelector("#worldTooltip"),
  form: document.querySelector("#commandForm"),
  input: document.querySelector("#commandInput"),
  answerTitle: document.querySelector("#answerTitle"),
  answerSummary: document.querySelector("#answerSummary"),
  answerSections: document.querySelector("#answerSections"),
  confidenceMeter: document.querySelector("#confidenceMeter"),
  confidenceText: document.querySelector("#confidenceText"),
  hover: document.querySelector("#jarvisHover"),
  hoverText: document.querySelector("#hoverText"),
  reactorButton: document.querySelector("#reactorButton"),
  micButton: document.querySelector("#micButton"),
  wakeButton: document.querySelector("#wakeButton"),
  speakButton: document.querySelector("#speakButton"),
  wakePortal: document.querySelector("#wakePortal"),
  wakeEnterButton: document.querySelector("#wakeEnterButton"),
  portalArmButton: document.querySelector("#portalArmButton"),
  portalEnterButton: document.querySelector("#portalEnterButton"),
  wakeStatus: document.querySelector("#wakeStatus"),
  wakeTranscript: document.querySelector("#wakeTranscript"),
  missionState: document.querySelector("#missionState"),
  privacyState: document.querySelector("#privacyState"),
  memoryCount: document.querySelector("#memoryCount"),
  localClock: document.querySelector("#localClock"),
  dateReadout: document.querySelector("#dateReadout"),
  signalList: document.querySelector("#signalList"),
  systemStream: document.querySelector("#systemStream"),
  memoryDeck: document.querySelector("#memoryDeck"),
  targetReadout: document.querySelector("#targetReadout"),
  scanProgress: document.querySelector("#scanProgress"),
  scanStatus: document.querySelector("#scanStatus"),
  orbitalMode: document.querySelector("#orbitalMode"),
  voiceState: document.querySelector("#voiceState"),
  satState: document.querySelector("#satState"),
  globeState: document.querySelector("#globeState"),
  starfield: document.querySelector("#starfield"),
  modeButtons: document.querySelectorAll("[data-mode]")
};

const appState = {
  lastCommand: initialCommandHistory[0] || DEFAULT_COMMAND,
  voiceEnabled: true,
  recognition: null,
  globe: null,
  stream: [],
  commandHistory: initialCommandHistory,
  personalMemory: initialPersonalMemory,
  wakeState: { ...DEFAULT_WAKE_STATE },
  recognitionActive: false,
  recognitionMode: "manual",
  speaking: false,
  wakeRestartTimer: null,
  wakeSleepTimer: null,
  desktopBridge: false,
  desktopEvents: null,
  scanFrame: null,
  motionReduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}

function updateClock() {
  const now = new Date();
  elements.localClock.textContent = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(now);
  elements.dateReadout.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit"
  }).format(now).toUpperCase();
}

function renderPersonalState() {
  const armed = appState.wakeState.armed;
  elements.wakeButton.classList.toggle("active", armed);
  elements.wakeButton.setAttribute("aria-pressed", String(armed));
  elements.wakeButton.textContent = armed ? "DISARM" : "ARM JARVIS";
  elements.portalArmButton.setAttribute("aria-pressed", String(armed));
  elements.portalArmButton.textContent = armed ? "DISARM WAKE CHANNEL" : "ARM WAKE CHANNEL";
  elements.privacyState.textContent = appState.desktopBridge ? "DESKTOP WAKE READY" : armed ? "LOCAL MIC ARMED" : "MIC OFF";
  elements.privacyState.dataset.armed = String(armed);
  elements.memoryCount.textContent = `${appState.personalMemory.length} NOTE${appState.personalMemory.length === 1 ? "" : "S"}`;
}

function scheduleWakeRestart(delay = 450) {
  window.clearTimeout(appState.wakeRestartTimer);
  if (!appState.wakeState.armed || appState.speaking) return;
  appState.wakeRestartTimer = window.setTimeout(() => startRecognition("wake"), delay);
}

function sleepInterface() {
  if (!appState.wakeState.armed) return;
  appState.wakeState = reduceWakeState(appState.wakeState, { type: "SLEEP" });
  document.body.classList.remove("jarvis-awake");
  document.body.classList.add("jarvis-dormant");
  elements.missionState.textContent = "WAKE ARMED";
  elements.wakeStatus.textContent = "Wake channel armed. Say Jarvis to enter the interface.";
  elements.wakeTranscript.textContent = "LISTENING FOR AUTHORIZED WAKE PHRASE";
}

function wakeInterface(message = "At your service.", transcript = "VOICE PRINT ACCEPTED") {
  window.clearTimeout(appState.wakeSleepTimer);
  document.body.classList.remove("jarvis-dormant");
  document.body.classList.add("jarvis-awake");
  elements.missionState.textContent = "ACTIVE";
  elements.wakeStatus.textContent = message;
  elements.wakeTranscript.textContent = transcript.toUpperCase();
  if (appState.wakeState.armed) {
    appState.wakeSleepTimer = window.setTimeout(sleepInterface, 18_000);
  }
}

function activateDesktopWake() {
  wakeInterface("Desktop wake phrase accepted. Personal intelligence matrix online.", "HEY JARVIS DETECTED");
  pushStream("DESKTOP WAKE", "Local companion requested foreground activation.", "green");
  elements.input.focus();
  speak("At your service.");
}

function setupDesktopWakeBridge() {
  const parameters = new URLSearchParams(window.location.search);
  if (parameters.get("desktop") !== "1") return;
  appState.desktopBridge = true;
  document.body.dataset.desktop = "true";
  renderPersonalState();
  if (parameters.get("wake") === "1") window.setTimeout(activateDesktopWake, 1_850);
  if (!("EventSource" in window)) return;
  const events = new EventSource("/api/wake/events");
  events.addEventListener("wake", activateDesktopWake);
  events.addEventListener("open", () => {
    elements.privacyState.textContent = "DESKTOP WAKE READY";
  });
  appState.desktopEvents = events;
  window.addEventListener("beforeunload", () => events.close(), { once: true });
}

function renderSignals() {
  elements.signalList.innerHTML = startupSignals
    .map((signal, index) => `<div class="signal-item"><span>0${index + 1}</span><strong>${escapeHtml(signal)}</strong></div>`)
    .join("");
}

function pushStream(label, detail, tone = "cyan") {
  const timestamp = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date());
  appState.stream = [{ label, detail, tone, timestamp }, ...appState.stream].slice(0, 5);
  elements.systemStream.innerHTML = appState.stream
    .map(
      (entry) => `
        <article class="stream-item" data-tone="${escapeHtml(entry.tone)}">
          <span>${escapeHtml(entry.timestamp)}</span>
          <strong>${escapeHtml(entry.label)}</strong>
          <p>${escapeHtml(entry.detail)}</p>
        </article>
      `
    )
    .join("");
}

function renderCommandMemory() {
  elements.memoryDeck.innerHTML = appState.commandHistory
    .slice(0, 4)
    .map(
      (command, index) => `
        <button type="button" data-memory-command="${escapeHtml(command)}">
          <span>0${index + 1}</span>
          <strong>${escapeHtml(command)}</strong>
        </button>
      `
    )
    .join("");
}

function runScanProgress(answer) {
  if (appState.scanFrame) cancelAnimationFrame(appState.scanFrame);
  const target = Math.max(64, Math.min(100, answer.confidence));
  const started = performance.now();
  const duration = appState.motionReduced ? 1 : 900;
  document.body.classList.add("is-executing");
  elements.scanStatus.textContent = answer.globeFocus
    ? `Locking ${answer.globeFocus.name || answer.globeFocus.label || "target"}...`
    : "Running planetary sweep...";

  const tick = (now) => {
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - (1 - progress) ** 3;
    elements.scanProgress.style.width = `${Math.round(target * eased)}%`;
    if (progress < 1) {
      appState.scanFrame = requestAnimationFrame(tick);
      return;
    }
    elements.scanStatus.textContent = `${answer.mode.toUpperCase()} stream stable. ${answer.confidence}% confidence.`;
    window.setTimeout(() => document.body.classList.remove("is-executing"), appState.motionReduced ? 0 : 650);
  };

  appState.scanFrame = requestAnimationFrame(tick);
}

function summonHover(text) {
  elements.hoverText.textContent = text;
  elements.hover.classList.remove("active");
  requestAnimationFrame(() => {
    elements.hover.classList.add("active");
    window.setTimeout(() => elements.hover.classList.remove("active"), 4200);
  });
}

function speak(text) {
  if (!appState.voiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 0.82;
  utterance.volume = 0.82;
  utterance.onstart = () => {
    appState.speaking = true;
  };
  const finishSpeech = () => {
    appState.speaking = false;
    scheduleWakeRestart(650);
  };
  utterance.onend = finishSpeech;
  utterance.onerror = finishSpeech;
  window.speechSynthesis.speak(utterance);
}

function setupSpeechOutput() {
  if ("speechSynthesis" in window) return;
  appState.voiceEnabled = false;
  elements.speakButton.disabled = true;
  elements.speakButton.classList.remove("active");
  elements.speakButton.setAttribute("aria-pressed", "false");
  elements.speakButton.textContent = "NO VOICE";
}

function renderAnswer(answer) {
  elements.answerTitle.textContent = answer.title;
  elements.answerSummary.textContent = answer.summary;
  elements.confidenceMeter.value = answer.confidence;
  elements.confidenceText.textContent = `${answer.confidence}%`;
  const sectionMarkup = answer.sections
    .map(
      (section, index) => `
        <article class="answer-card" style="--i: ${index}">
          <span>${escapeHtml(section.heading)}</span>
          <p>${escapeHtml(section.body)}</p>
        </article>
      `
    )
    .join("");
  const actionMarkup = answer.actions?.length
    ? `<div class="action-ribbon"><span>NEXT ACTIONS</span>${answer.actions
      .slice(0, 3)
      .map((action) => `<button type="button" data-action-command="${escapeHtml(action)}">${escapeHtml(action)}</button>`)
      .join("")}</div>`
    : "";
  elements.answerSections.innerHTML = sectionMarkup + actionMarkup;
  elements.orbitalMode.textContent = answer.mode.toUpperCase();
  elements.satState.textContent = answer.mode === "satellite" ? "LOCKED" : "ACTIVE";
  elements.globeState.textContent = answer.globeFocus ? "FOCUSED" : "TRACKING";
  elements.targetReadout.textContent = answer.globeFocus
    ? (answer.globeFocus.name || answer.globeFocus.label || "TARGET").toUpperCase()
    : "GLOBAL SWEEP";

  if (answer.globeFocus) {
    appState.globe.focusLocation(answer.globeFocus);
  } else if (answer.mode === "global") {
    appState.globe.runGlobalScan();
  }

  runScanProgress(answer);
  pushStream(answer.mode.toUpperCase(), answer.title, answer.mode === "satellite" ? "green" : "cyan");
  summonHover(answer.summary);
  if (!document.body.classList.contains("jarvis-dormant")) {
    speak(`${answer.title}. ${answer.summary}`);
  }
}

function executeCommand(command, options = {}) {
  const finalCommand = command?.trim() || appState.lastCommand;
  if (!finalCommand) return;
  wakeInterface("Command channel active.", finalCommand);
  appState.lastCommand = finalCommand;
  appState.commandHistory = addCommand(appState.commandHistory, finalCommand);
  saveCommandHistory(storage, appState.commandHistory);
  renderCommandMemory();
  elements.input.value = finalCommand;
  elements.reactorButton.classList.add("wake");
  window.setTimeout(() => elements.reactorButton.classList.remove("wake"), 950);
  pushStream("COMMAND", finalCommand, "amber");
  const personalAnswer = routePersonalCommand(finalCommand, { memory: appState.personalMemory });
  if (personalAnswer?.mutation?.type === "remember") {
    appState.personalMemory = addMemoryNote(appState.personalMemory, personalAnswer.mutation.value);
    savePersonalMemory(storage, appState.personalMemory);
    renderPersonalState();
  }
  const answer = personalAnswer || answerQuery(finalCommand, options);
  if (appState.wakeState.armed && appState.recognitionActive) appState.recognition.stop();
  renderAnswer(answer);
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    elements.voiceState.textContent = "TTS ONLY";
    elements.micButton.disabled = true;
    elements.micButton.textContent = "NO MIC";
    elements.wakeButton.disabled = true;
    elements.wakeButton.textContent = "WAKE N/A";
    elements.wakeStatus.textContent = "Voice recognition is unavailable in this browser. Enter manually or use the desktop companion.";
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.onstart = () => {
    appState.recognitionActive = true;
    const wakeMode = appState.recognitionMode === "wake";
    elements.voiceState.textContent = wakeMode ? "WAKE ARMED" : "LISTENING";
    elements.micButton.classList.toggle("active", !wakeMode);
    elements.micButton.setAttribute("aria-pressed", String(!wakeMode));
    if (wakeMode) elements.wakeTranscript.textContent = "LISTENING FOR JARVIS";
  };
  recognition.onend = () => {
    appState.recognitionActive = false;
    elements.voiceState.textContent = appState.wakeState.armed ? "ARMED" : "STANDBY";
    elements.micButton.classList.remove("active");
    elements.micButton.setAttribute("aria-pressed", "false");
    scheduleWakeRestart();
  };
  recognition.onerror = (event) => {
    const blocked = ["not-allowed", "service-not-allowed"].includes(event.error);
    const expectedSilence = event.error === "no-speech" && appState.wakeState.armed;
    elements.voiceState.textContent = expectedSilence ? "ARMED" : event.error === "aborted" ? "STANDBY" : blocked ? "BLOCKED" : "ERROR";
    elements.micButton.classList.remove("active");
    elements.micButton.setAttribute("aria-pressed", "false");
    if (blocked) {
      appState.wakeState = reduceWakeState(appState.wakeState, { type: "DISARM" });
      renderPersonalState();
      elements.wakeStatus.textContent = "Microphone access was blocked. Grant permission or enter manually.";
    }
    if (!expectedSilence && event.error !== "aborted") {
      pushStream("VOICE ERROR", event.error || "Speech recognition failed.", "amber");
    }
  };
  recognition.onresult = (event) => {
    for (let index = event.resultIndex ?? 0; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result?.[0]?.transcript?.trim() || "";
      if (!transcript) continue;
      elements.wakeTranscript.textContent = transcript.toUpperCase();
      if (!result.isFinal) continue;

      if (appState.wakeState.armed) {
        appState.wakeState = reduceWakeState(appState.wakeState, { type: "HEARD", transcript });
        renderPersonalState();
        if (appState.wakeState.command) {
          executeCommand(appState.wakeState.command);
        } else if (appState.wakeState.awake) {
          wakeInterface("Wake word accepted. What can I do for you?", transcript);
          pushStream("WAKE WORD", "Voice print accepted. Awaiting follow-up command.", "green");
        }
        continue;
      }

      executeCommand(transcript);
      recognition.stop();
    }
  };
  appState.recognition = recognition;
}

function startRecognition(mode = "manual") {
  if (!appState.recognition || appState.recognitionActive || appState.speaking) return;
  appState.recognitionMode = mode;
  appState.recognition.continuous = mode === "wake";
  appState.recognition.interimResults = mode === "wake";
  try {
    appState.recognition.start();
  } catch {
    elements.voiceState.textContent = "BUSY";
  }
}

function toggleSpeechRecognition() {
  if (!appState.recognition) return;
  if (appState.wakeState.armed) {
    wakeInterface("The wake channel is already listening. Say Jarvis, then your command.");
    return;
  }
  if (elements.micButton.getAttribute("aria-pressed") === "true") {
    appState.recognition.stop();
    return;
  }
  startRecognition("manual");
}

function toggleWakeWord() {
  if (!appState.recognition) {
    wakeInterface("Wake recognition is unavailable here. Manual command access remains online.");
    return;
  }
  if (appState.wakeState.armed) {
    appState.wakeState = reduceWakeState(appState.wakeState, { type: "DISARM" });
    window.clearTimeout(appState.wakeRestartTimer);
    window.clearTimeout(appState.wakeSleepTimer);
    if (appState.recognitionActive) appState.recognition.stop();
    document.body.classList.remove("jarvis-dormant");
    elements.missionState.textContent = "MANUAL";
    elements.wakeStatus.textContent = "Wake channel offline. Manual controls remain available.";
  } else {
    appState.wakeState = reduceWakeState(appState.wakeState, { type: "ARM" });
    sleepInterface();
    startRecognition("wake");
  }
  renderPersonalState();
}

function drawStarfield() {
  const canvas = elements.starfield;
  const ctx = canvas.getContext("2d");
  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  };
  resize();
  const stars = Array.from({ length: 220 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.7 + 0.2,
    s: Math.random() * 0.6 + 0.2
  }));
  const draw = (time = 0) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(2, 10, 18, 0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const star of stars) {
      const alpha = 0.25 + Math.sin(time * 0.001 * star.s + star.x * 20) * 0.24;
      ctx.fillStyle = `rgba(104, 228, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x * canvas.width, star.y * canvas.height, star.r * window.devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!appState.motionReduced) requestAnimationFrame(draw);
  };
  window.addEventListener("resize", resize);
  draw();
}

function bindEvents() {
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    executeCommand(elements.input.value);
  });
  elements.reactorButton.addEventListener("click", () => executeCommand(appState.lastCommand, { includeBootSignals: true }));
  elements.micButton.addEventListener("click", toggleSpeechRecognition);
  elements.wakeButton.addEventListener("click", toggleWakeWord);
  elements.portalArmButton.addEventListener("click", toggleWakeWord);
  elements.wakeEnterButton.addEventListener("click", () => {
    wakeInterface("Manual authorization accepted. Command deck online.");
    elements.input.focus();
  });
  elements.portalEnterButton.addEventListener("click", () => {
    wakeInterface("Manual authorization accepted. Command deck online.");
    elements.input.focus();
  });
  elements.speakButton.addEventListener("click", () => {
    appState.voiceEnabled = !appState.voiceEnabled;
    if (!appState.voiceEnabled) window.speechSynthesis.cancel();
    elements.speakButton.classList.toggle("active", appState.voiceEnabled);
    elements.speakButton.setAttribute("aria-pressed", String(appState.voiceEnabled));
    elements.speakButton.textContent = appState.voiceEnabled ? "VOICE" : "MUTE";
  });
  document.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-command]").forEach((item) => item.classList.toggle("active", item === button));
      executeCommand(button.dataset.command);
    });
  });
  elements.memoryDeck.addEventListener("click", (event) => {
    const button = event.target.closest("[data-memory-command]");
    if (!button) return;
    executeCommand(button.dataset.memoryCommand);
  });
  elements.answerSections.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action-command]");
    if (!button) return;
    executeCommand(button.dataset.actionCommand);
  });
  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      elements.modeButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      document.body.dataset.globeMode = mode;
      appState.globe.setVisualMode(mode);
      pushStream("VISUAL MODE", `${mode.toUpperCase()} renderer engaged.`, mode === "night" ? "violet" : "cyan");
      summonHover(`${mode.toUpperCase()} globe mode engaged.`);
    });
  });
  window.addEventListener("jarvis-location", (event) => {
    executeCommand(`show me ${event.detail.name} satellite intelligence`);
  });
  window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "j") {
      event.preventDefault();
      wakeInterface("Keyboard authorization accepted. Command channel open.");
      elements.input.focus();
      summonHover("Command channel open.");
    }
    if (event.key === "Escape" && appState.wakeState.armed) sleepInterface();
  });
  window.addEventListener("pointermove", (event) => {
    document.documentElement.style.setProperty("--pointer-x", `${Math.round((event.clientX / window.innerWidth) * 100)}%`);
    document.documentElement.style.setProperty("--pointer-y", `${Math.round((event.clientY / window.innerHeight) * 100)}%`);
  });
}

function init() {
  document.body.dataset.globeMode = "earth";
  document.body.classList.add("jarvis-dormant");
  elements.input.value = appState.lastCommand;
  updateClock();
  window.setInterval(updateClock, 1_000);
  drawStarfield();
  renderSignals();
  renderCommandMemory();
  renderPersonalState();
  pushStream("BOOT", "JARVIS interface mounted. Reactor channel ready.", "green");
  appState.globe = new JarvisGlobe(elements.mount, elements.tooltip);
  setupSpeechOutput();
  setupSpeechRecognition();
  bindEvents();
  renderAnswer(bootAnswer());
  elements.missionState.textContent = "STANDBY";
  setupDesktopWakeBridge();
}

init();
