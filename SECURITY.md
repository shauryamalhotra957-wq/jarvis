# Security Notes

This app is a local prototype. Its deterministic command and memory routes do not send commands to external services. Browser speech recognition may use the browser vendor's online recognition service, depending on browser implementation.

## Implemented Safety

- The assistant core is deterministic and local.
- No secrets are required.
- Browser voice recognition is activated only after pressing the mic button or explicitly arming the wake channel.
- Continuous browser wake mode exposes visible armed/listening state and can be disarmed at any time.
- The Windows wake companion uses a phrase-limited installed speech recognizer and does not save audio.
- The desktop bridge binds only to `127.0.0.1`, contains static paths inside `dist`, rejects cross-origin wake requests, and exposes no command-execution endpoint.
- Personal notes are stored in origin-scoped `localStorage`, are bounded in length/count, and are never treated as executable input.
- Speech synthesis can be muted.
- Commands are treated as input, not executable code.

## User Responsibilities

- Do not store passwords, API keys, medical data, or other secrets in personal memory. Browser storage is not encrypted.
- Review browser microphone and speech-service privacy before enabling wake mode.
- Run the desktop companion only from a trusted local checkout.
- Use the included uninstall script to remove sign-in startup behavior when it is no longer wanted.

## Production Requirements

- Use explicit user permission for microphone, filesystem, contacts, calendar, and automation tools.
- Add a tool permission layer before any command can affect the OS or network.
- Keep the desktop overlay isolated from sensitive windows unless the user explicitly grants access.
- Log tool actions with timestamps and reversible audit trails.
- Use allowlisted APIs for live geospatial data.
- Add prompt-injection defenses if an LLM or web retrieval layer is connected.
