# Desktop Packaging Plan

The current deliverable is a browser-based application. The design intentionally imitates a desktop assistant with a taskbar orb, but production OS-level behavior requires a desktop shell.

## Electron/Tauri Upgrade

1. Wrap the Vite app in Electron or Tauri.
2. Create a tray icon using the arc-reactor orb.
3. Add global shortcuts:
   - `Ctrl+Space`: open command overlay.
   - `Ctrl+Shift+G`: focus globe.
   - `Ctrl+Shift+M`: toggle microphone.
4. Add a transparent always-on-top overlay window for the hovering JARVIS panel.
5. Add permission prompts for microphone, files, network APIs, and automation.
6. Store user settings securely.

## Why Not Fake It

Browsers cannot place real controls in the Windows taskbar or draw over every app without user-installed desktop permissions. This prototype gives the full visual and interaction model, while this plan describes the real implementation path.
