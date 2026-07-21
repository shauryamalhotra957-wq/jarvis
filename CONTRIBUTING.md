# Contributing

Thanks for improving Jarvis.

## Development setup

1. Fork or clone the repository.
2. Create a focused branch from `main`.
3. Install dependencies with `npm ci`.
4. Start the web client with `npm run dev`.

## Quality checks

Run:

```bash
npm run validate
```

Add tests under `tests/` for behavior changes. Exercise desktop-specific changes with `npm run desktop` when applicable.

## Pull requests

Describe the user impact, implementation, and validation. Include screenshots for interface changes and do not commit credentials or generated build output.
