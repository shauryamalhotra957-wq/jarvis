# Security Notes

This app is a local prototype. It does not send commands to external services.

## Implemented Safety

- The assistant core is deterministic and local.
- No secrets are required.
- Voice recognition is only activated after pressing the mic button.
- Speech synthesis can be muted.
- Commands are treated as input, not executable code.

## Production Requirements

- Use explicit user permission for microphone, filesystem, contacts, calendar, and automation tools.
- Add a tool permission layer before any command can affect the OS or network.
- Keep the desktop overlay isolated from sensitive windows unless the user explicitly grants access.
- Log tool actions with timestamps and reversible audit trails.
- Use allowlisted APIs for live geospatial data.
- Add prompt-injection defenses if an LLM or web retrieval layer is connected.
