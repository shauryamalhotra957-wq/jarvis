import "./styles.css";
import { answerQuery, bootAnswer } from "./core/assistantCore.js";
import { startupSignals } from "./data/worldIntel.js";
import { JarvisGlobe } from "./globe.js";

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
  speakButton: document.querySelector("#speakButton"),
  signalList: document.querySelector("#signalList"),
  systemStream: document.querySelector("#systemStream"),
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
  lastCommand: "show me satellite intel over Tokyo",
  voiceEnabled: true,
  recognition: null,
  globe: null,
  stream: [],
  scanFrame: null,
  motionReduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
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
  window.speechSynthesis.speak(utterance);
}

function renderAnswer(answer) {
  elements.answerTitle.textContent = answer.title;
  elements.answerSummary.textContent = answer.summary;
  elements.confidenceMeter.value = answer.confidence;
  elements.confidenceText.textContent = `${answer.confidence}%`;
  elements.answerSections.innerHTML = answer.sections
    .map(
      (section, index) => `
        <article class="answer-card" style="--i: ${index}">
          <span>${escapeHtml(section.heading)}</span>
          <p>${escapeHtml(section.body)}</p>
        </article>
      `
    )
    .join("");
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
  speak(`${answer.title}. ${answer.summary}`);
}

function executeCommand(command, options = {}) {
  const finalCommand = command?.trim() || appState.lastCommand;
  if (!finalCommand) return;
  appState.lastCommand = finalCommand;
  elements.input.value = finalCommand;
  elements.reactorButton.classList.add("wake");
  window.setTimeout(() => elements.reactorButton.classList.remove("wake"), 950);
  pushStream("COMMAND", finalCommand, "amber");
  const answer = answerQuery(finalCommand, options);
  renderAnswer(answer);
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    elements.voiceState.textContent = "TTS ONLY";
    elements.micButton.disabled = true;
    elements.micButton.textContent = "NO MIC";
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onstart = () => {
    elements.voiceState.textContent = "LISTENING";
    elements.micButton.classList.add("active");
    elements.micButton.setAttribute("aria-pressed", "true");
  };
  recognition.onend = () => {
    elements.voiceState.textContent = "STANDBY";
    elements.micButton.classList.remove("active");
    elements.micButton.setAttribute("aria-pressed", "false");
  };
  recognition.onerror = () => {
    elements.voiceState.textContent = "BLOCKED";
    elements.micButton.classList.remove("active");
    elements.micButton.setAttribute("aria-pressed", "false");
  };
  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    executeCommand(transcript);
  };
  appState.recognition = recognition;
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
  elements.micButton.addEventListener("click", () => appState.recognition?.start());
  elements.speakButton.addEventListener("click", () => {
    appState.voiceEnabled = !appState.voiceEnabled;
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
      elements.input.focus();
      summonHover("Command channel open.");
    }
  });
  window.addEventListener("pointermove", (event) => {
    document.documentElement.style.setProperty("--pointer-x", `${Math.round((event.clientX / window.innerWidth) * 100)}%`);
    document.documentElement.style.setProperty("--pointer-y", `${Math.round((event.clientY / window.innerHeight) * 100)}%`);
  });
}

function init() {
  document.body.dataset.globeMode = "earth";
  drawStarfield();
  renderSignals();
  pushStream("BOOT", "JARVIS interface mounted. Reactor channel ready.", "green");
  appState.globe = new JarvisGlobe(elements.mount, elements.tooltip);
  setupSpeechRecognition();
  bindEvents();
  renderAnswer(bootAnswer());
}

init();
