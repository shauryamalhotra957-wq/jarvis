# Desktop Wake Service

The repository includes an opt-in Windows companion that continuously listens for a small local grammar (`Jarvis`, `Hey Jarvis`, or `Okay Jarvis`), foregrounds a dedicated Edge app window, and signals the running interface through a loopback-only event bridge.

## Requirements

- Windows 10 or 11.
- Windows PowerShell 5.1 with the `System.Speech` assembly.
- An installed Windows speech recognizer; `en-US` is preferred.
- Node.js `^20.19.0` or `>=22.12.0`.
- Microsoft Edge is preferred for the dedicated app window. The default browser is used as a fallback.

## Run It

```powershell
npm ci
npm run build
powershell -ExecutionPolicy Bypass -File .\desktop\JarvisWake.ps1
```

The service:

1. Starts `desktop/server.mjs` on `127.0.0.1:4374`.
2. Loads a phrase-limited Windows speech grammar.
3. Waits locally for a wake phrase.
4. Opens or foregrounds the JARVIS Edge app window.
5. Posts a loopback wake event so an existing interface animates immediately.

Press `Ctrl+C` in the service console to stop the recognizer and the bridge it started.

## Start At Sign-in

Install a per-user Startup-folder shortcut:

```powershell
powershell -ExecutionPolicy Bypass -File .\desktop\Install-JarvisWake.ps1 -StartNow
```

Remove the shortcut:

```powershell
powershell -ExecutionPolicy Bypass -File .\desktop\Uninstall-JarvisWake.ps1
```

Installation is never automatic. The script only creates a shortcut in the current user's Startup folder; it does not create a Windows service, require administrator privileges, or change the execution policy globally.

## Tuning

```powershell
.\desktop\JarvisWake.ps1 -MinimumConfidence 0.78 -CooldownSeconds 6 -Port 4374
```

- Increase `MinimumConfidence` if background audio causes false activations.
- Increase `CooldownSeconds` if the phrase is detected twice.
- Use `-NoBuild` to fail instead of creating a missing production build.

## Privacy And Security

- Wake recognition uses the installed Windows `System.Speech` recognizer and a three-phrase grammar.
- The Node bridge binds only to `127.0.0.1`; it is not exposed to the LAN.
- The bridge accepts only static `GET`/`HEAD`, health, wake-event, and event-stream routes.
- Static paths are contained inside `dist`, responses use a restrictive content security policy, and no command execution endpoint exists.
- The companion does not record audio files, send transcripts to the app, or execute arbitrary spoken commands. It only foregrounds the command interface.
- Free-form browser speech recognition remains a separate, explicit interface permission and may use the browser vendor's online recognition service.

## Troubleshooting

### No installed recognizer

Install an English speech pack in Windows Settings under **Time & language -> Speech**, then retry.

### Microphone unavailable

Check Windows **Privacy & security → Microphone** and allow desktop applications to access the microphone.

### UI opens but does not animate

Confirm the health route returns JSON:

```powershell
Invoke-RestMethod http://127.0.0.1:4374/api/health
```

Then send a test wake event:

```powershell
Invoke-RestMethod http://127.0.0.1:4374/api/wake -Method Post
```

## Packaging Boundary

The shipped PowerShell companion is the supported no-admin wake-to-screen implementation. A signed Tauri or Electron wrapper would be optional distribution packaging for automatic updates or a tray icon; it is not required for voice activation, foregrounding, or the cinematic interface.
