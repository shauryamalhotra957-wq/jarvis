# Design Research And Attribution

This implementation is original code. It synthesizes interaction patterns from public references without copying source code, proprietary assets, movie frames, character voices, or another product's layout.

## Product And Voice References

- [Ion](https://github.com/gbaptista/ion) informed the wake → capture → response → follow-up event sequence, visible voice states, and persona-oriented configuration concept. Ion is MIT-licensed; no Ion code or assets are included.
- [Jarvis Desktop Voice Assistant](https://github.com/kishanrajput23/Jarvis-Desktop-Voice-Assistant) informed the practical action catalog: time/date, websites, notes, screenshots, and application commands. This project implements only safe local note, clock, brief, and diagnostic routes.
- [OpenJarvis](https://github.com/open-jarvis/OpenJarvis) informed the local-first boundary, explicit tools/memory separation, and the idea that cost, latency, and privacy belong in the architecture. No OpenJarvis code is included.
- [How to Start Building Your Own Jarvis](https://kalashnikovisme.medium.com/how-to-start-building-your-own-jarvis-almost-everyone-does-it-wrong-daac4a9ee1fe) informed the focus on personal context, adaptation, anywhere-access, and meaningful actions rather than a chat-only demo.
- [openWakeWord](https://github.com/dscripka/openWakeWord) informed the desktop wake-word research. Its `hey jarvis` model is not bundled because model licensing and runtime requirements differ from this project's zero-download Windows path.
- The user-supplied [video reference](https://www.youtube.com/watch?v=4WBOmhI11rQ&t=945s) was treated as an aesthetic reference only.

## Interface Research

The supplied galleries—Saaspo, Land-book, UI Jar, Design Vault, Collect UI, UI Garage, Lapa Ninja, One Page Love, Nicely Done, SaaS Pages, UI Sources, Site See, Page Flows, Curated Design, Scrnshts, Screenlane, App Fuel, Mobbin, Refero, and SaaS Landing Page—were used as a broad pattern library.

The resulting design rules are:

1. Lead with one obvious state: dormant, armed, awake, or executing.
2. Use progressive disclosure: reactor portal first, full telemetry after activation.
3. Keep color semantic: cyan for system context, green for ready/accepted, amber for execution or warning, violet for alternate visualization.
4. Give every voice state visible text; animation is supporting feedback, never the only feedback.
5. Keep primary commands in the bottom dock and diagnostics in side panels.
6. Use dense telemetry without sacrificing a clear focal point.
7. Preserve keyboard access, manual entry, responsive layout, and reduced-motion behavior.

## Cinematic Boundary

The visual language is inspired by cinematic holographic command centers: concentric reactor geometry, orbital reticles, thin technical typography, scan lines, glass panels, and functional telemetry. All geometry, styling, text, and animation in this repository were authored for this project. No Marvel Studios, Disney, Iron Man, or film UI assets are distributed.
