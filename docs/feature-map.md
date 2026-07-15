# Feature Map

## Interface

- Futuristic HUD panels.
- Full-screen interactive globe.
- Blue arc-reactor orb in the taskbar.
- Hovering JARVIS response panel.
- Live command stream with timestamped command and mode events.
- Target-lock card with animated scan progress.
- Globe visual mode dock: Earth, Night, Tactical.
- Quick command chips.
- Voice output toggle.
- Speech recognition button where browser-supported.
- Dormant reactor portal with manual and wake-channel authorization.
- Continuous browser wake mode with direct-command and follow-up-command flows.
- Visible microphone privacy, wake state, local-memory count, and desktop bridge state.
- Live mission clock and system state header.
- Clickable next-action ribbon in structured answers.
- Keyboard shortcut: `Ctrl+J` or `Cmd+J` focuses the command channel.

## Globe

- Three.js WebGL renderer.
- OrbitControls with damping and auto-rotation.
- High-resolution NASA Blue Marble topography/bathymetry Earth texture.
- NASA city-lights night texture blended across the dark side.
- Shader-based daylight terminator, rim atmosphere, and subtle ocean glint.
- High-resolution procedural cloud layer.
- Atmospheric glow shader.
- Starfield.
- Indexed city and region markers.
- Satellite orbit ring.
- Animated satellite mesh.
- Beam pointer from satellite to focused location.
- Animated lock reticle on the selected Earth coordinate.
- Smooth globe focus transition for selected targets.
- Clickable globe nodes.

## Intelligence

- Location matching.
- Topic matching.
- Coordinate parsing.
- Combined location-plus-topic answers.
- Satellite mode.
- Global fallback scan.
- Confidence score.
- Structured answer cards.
- Animated answer-card reveal.
- Scan progress state.
- Reduced-motion-safe interface path.
- Production integration guidance.
- Local personal notes with explicit `remember` commands.
- Daily brief from local time and saved personal context.
- Local time, date, and diagnostic routes.
- Persistent bounded command and personal-memory stores with failure-safe fallbacks.

## Desktop Companion

- Loopback-only Node static server.
- Server-Sent Events wake bridge.
- Windows `System.Speech` phrase-limited recognizer.
- Edge app-window launch and foreground activation.
- Confidence threshold and cooldown controls.
- Opt-in per-user Startup shortcut installer and remover.
- No arbitrary spoken shell execution.

## Extension Surface

The architecture can support thousands of feature modules because commands are routed through data-driven topics and locations. Add new capabilities by adding topics, tools, and live data adapters.
