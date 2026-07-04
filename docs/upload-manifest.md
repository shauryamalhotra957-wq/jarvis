# JARVIS GitHub Upload Manifest

This manifest defines what belongs in the public JARVIS repository and what must stay out of Git.

## Publish These Files

- `.gitignore`
- `README.md`
- `SECURITY.md`
- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `src/**`
- `tests/**`
- `docs/**`
- `public/assets/earth/**`

## Do Not Publish

- `node_modules/`
- `dist/`
- `.vite/`
- `coverage/`
- `.env`
- `.env.*`
- `*.log`
- local browser profiles
- local credentials or tokens
- temporary files

## Repository Metadata

Recommended repository name:

```text
jarvis
```

Recommended repository description:

```text
Futuristic JARVIS-style AI assistant UI with a high-resolution Three.js Earth, satellite targeting, glowing arc-reactor command orb, voice commands, tests, docs, and production-ready upgrade notes.
```

Recommended topics:

```text
jarvis
threejs
vite
ai-assistant
globe
earth
satellite
voice-ui
mission-control
javascript
frontend
cyberpunk-ui
```

## Release Validation

Run these checks before pushing:

```powershell
npm test
npm run build
npm audit --audit-level=moderate
```

The repository should only be pushed when tests and build pass, and the audit has no moderate-or-higher vulnerabilities.

## Post-Push Verification

After pushing, verify the GitHub repository contains:

- README with screenshots rendering from `docs/screenshots/`.
- Security documentation.
- Source files under `src/`.
- Test files under `tests/`.
- Earth textures under `public/assets/earth/`.
- Architecture, feature, desktop packaging, and upload manifest docs.
- No dependency folders, generated build folders, logs, local credentials, or environment files.
