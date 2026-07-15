# JARVIS

JARVIS is a cinematic personal-intelligence interface built around a high-resolution interactive Earth, wake-word activation, local personal memory, satellite-style target locks, a glowing arc-reactor command portal, voice-capable commands, and a deterministic local response engine.

The project is designed to feel like an advanced mission-control assistant: ask a question, select a region on the globe, or trigger a scan, and JARVIS overlays structured information with smooth motion, live telemetry, and a cinematic blue interface.

![JARVIS polished desktop interface](docs/screenshots/jarvis-polished-desktop.png)

## Project Snapshot

| Area | Detail |
| --- | --- |
| Experience | Dormant-to-awake cinematic assistant UI with interactive Earth |
| Core system | Three.js globe, wake state machine, personal routes, target focusing, telemetry overlays |
| Voice paths | Browser wake mode plus optional Windows startup companion |
| Quality signal | Node test suite, PowerShell syntax checks, production build validation, security notes |

## Repository Description

**GitHub description:** Cinematic local-first JARVIS interface with wake-word activation, personal memory, Windows desktop companion, Three.js Earth, satellite targeting, tests, and docs.

Recommended topics:

`jarvis`, `threejs`, `vite`, `ai-assistant`, `globe`, `earth`, `satellite`, `voice-ui`, `mission-control`, `javascript`, `frontend`, `cyberpunk-ui`

## Highlights

- Full-screen 3D Earth powered by Three.js.
- NASA Blue Marble topography/bathymetry imagery for a realistic high-resolution planet surface.
- NASA city-lights texture blended on the night side of the globe.
- Earth, Night, and Tactical display modes.
- Orbital satellite animation with a beam pointer and target-lock reticle.
- Smooth globe focusing for major world nodes and coordinate-based scans.
- Dormant arc-reactor portal that reveals the full command deck when JARVIS is activated.
- Browser wake-word flow with single-phrase commands and natural follow-up capture.
- Optional Windows companion that listens locally, starts/focuses an Edge app window, and wakes the live interface.
- Typed command input plus browser speech synthesis and one-shot speech recognition where supported.
- Local personal memory, daily brief, time/date, and diagnostic command routes.
- Explicit microphone, wake-channel, memory, and desktop-bridge status indicators.
- Floating JARVIS response overlay with animated answer cards.
- Live telemetry stream, scan progress, target state, signal strength, and command feedback.
- Mobile layout support with reduced-motion accessibility handling.
- Deterministic local intelligence engine covered by tests.
- Security and production hardening notes included in the repo.

## Demo Screens

![JARVIS command lock over Delhi](docs/screenshots/jarvis-command-delhi.png)

![JARVIS mobile layout](docs/screenshots/jarvis-polished-mobile.png)

## Quick Start

```powershell
npm install
npm run start
```

Open:

```text
http://127.0.0.1:4373
```

Click **ARM WAKE CHANNEL**, grant microphone permission, then say either `Jarvis` followed by a command or one phrase such as `Jarvis, give me my daily brief`.

### Windows wake service

The optional companion can bring the interface forward even when the browser UI is not focused:

```powershell
npm run build
powershell -ExecutionPolicy Bypass -File .\desktop\JarvisWake.ps1
```

See [Desktop Wake Service](docs/desktop-packaging.md) for startup installation, privacy behavior, and removal.

## Validate

```powershell
npm run validate
```

`npm run validate` runs the unit tests and production build.

For the full release check:

```powershell
npm test
npm run build
npm audit --audit-level=moderate
```

## Example Commands

- `show me satellite intel over Tokyo`
- `show Delhi climate risk`
- `track satellite over Singapore`
- `explain cybersecurity threat level`
- `focus Pacific ocean climate signals`
- `explain the arc reactor blue orb`
- `scan lat 40.7 lon -74.0`
- `Jarvis, give me my daily brief`
- `remember that my priority is the vehicle HMI prototype`
- `what do you remember`
- `run system diagnostics`

## Project Structure

```text
jarvis/
  index.html                 App shell and interface markup
  src/
    main.js                  UI events, voice, answer rendering, and app bootstrap
    globe.js                 Three.js scene, globe controls, Earth shader, and animations
    core/
      assistantCore.js       Local command interpretation and structured responses
      commandHistory.js      Resilient recent-command persistence
      geo.js                 Coordinate parsing and nearest-location helpers
      personalIntelligence.js Local memory, brief, clock, and diagnostic routes
      wakeWord.js            Pure wake phrase parser and state reducer
    data/
      worldIntel.js          Globe targets, topics, telemetry, and regional metadata
    styles.css               Futuristic UI, responsive layout, motion, accessibility
  public/assets/earth/       Earth and night-lights textures
  desktop/
    server.mjs               Locked-down local static server and wake event bridge
    JarvisWake.ps1           Windows local speech recognizer and app foreground service
    Install-JarvisWake.ps1   Opt-in startup shortcut installer
    Uninstall-JarvisWake.ps1 Startup shortcut remover
  tests/                     Node test suite for assistant behavior
  docs/
    architecture.md          System architecture and module map
    desktop-packaging.md     Working Windows desktop wake-service guide
    wake-word-architecture.md Voice state, privacy, and fallback design
    design-research.md       Inspiration synthesis and attribution boundaries
    feature-map.md           Feature inventory and implementation coverage
    upload-manifest.md       What should and should not be published to GitHub
    screenshots/             Verified desktop and mobile screenshots
  SECURITY.md                Security model and hardening checklist
```

## How The Assistant Works

JARVIS is a local deterministic prototype. Speech first passes through a tested wake state machine. Commands then route through local personal actions or the world-intelligence engine, update the satellite/reticle state, persist only explicitly requested personal notes in origin-scoped browser storage, and render structured response cards. This keeps the demo fast and testable while leaving a clean path to connect an LLM, retrieval layer, and live data behind a permissions boundary.

The globe layer is interactive and visual-first: a user can click target nodes, type a mission-style query, or use supported browser voice APIs. The app then synchronizes globe focus, scan progress, telemetry updates, and the hovering assistant panel so the UI feels like one coordinated system.

## Documentation

- [Architecture](docs/architecture.md)
- [Feature Map](docs/feature-map.md)
- [Desktop Wake Service](docs/desktop-packaging.md)
- [Wake-word Architecture](docs/wake-word-architecture.md)
- [Design Research and Attribution](docs/design-research.md)
- [Upload Manifest](docs/upload-manifest.md)
- [Security Notes](SECURITY.md)

## Research Grounding

- Three.js renderer and controls documentation: https://threejs.org/docs/
- OrbitControls documentation: https://threejs.org/docs/pages/OrbitControls.html
- Web Speech API documentation: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- SpeechRecognition documentation: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- Ion voice interface and wake/follow-up event model: https://github.com/gbaptista/ion
- OpenJarvis local-first personal AI architecture: https://github.com/open-jarvis/OpenJarvis
- Jarvis Desktop Voice Assistant action catalog: https://github.com/kishanrajput23/Jarvis-Desktop-Voice-Assistant
- Personal assistant context and action design essay: https://kalashnikovisme.medium.com/how-to-start-building-your-own-jarvis-almost-everyone-does-it-wrong-daac4a9ee1fe
- openWakeWord local wake-word framework and `hey jarvis` model documentation: https://github.com/dscripka/openWakeWord
- NASA Blue Marble Next Generation topography/bathymetry imagery: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/
- NASA Scientific Visualization Studio Earth city-lights texture: https://svs.gsfc.nasa.gov/30003/

## Production Upgrade Path

To turn this prototype into a real desktop JARVIS:

- Package the working desktop bridge as a signed native tray application.
- Add a transparent always-on-top assistant overlay and global shortcut.
- Connect live geospatial APIs such as NASA Earthdata, Sentinel Hub, NOAA, USGS, AIS vessel feeds, and weather alerts.
- Add an LLM tool layer with retrieval, citations, and permissions-aware actions.
- Store long-term user preferences in encrypted local storage.
- Add offline free-form speech-to-text after the implemented local wake phrase, plus a secure permissions console.
- Add signed builds, update channels, crash reporting, and security review gates.

## License

This project is currently marked `UNLICENSED` in `package.json`. Add a license before accepting external contributions or reuse.

## Experience Design

The cinematic command interface follows the repository's [JARVIS design system](design-system/jarvis/MASTER.md), including keyboard-visible focus, 44px interaction targets, responsive HUD composition, and reduced-motion behavior.
