# Cassetta

Turborepo workspace for the Cassetta music application.

## Apps

- `apps/web` — Next.js web client (`Kato-111/cassette`)
- `apps/mobile` — Expo/React Native mobile client
- `apps/music-importer` — Bun/Hono music importer (preserved from `music-importer-archive`)

## Development

```bash
pnpm install
pnpm dev
```

Run one app with Turbo's package filter, for example:

```bash
pnpm --filter @cassetta/web dev
pnpm --filter @cassetta/mobile dev
pnpm --filter @cassetta/music-importer dev
```

The mobile client needs the web API running. Its `.env` uses the computer's LAN
address so Android devices on the same network can reach Next.js. For Android
background playback and lock-screen controls, create a development build with
`pnpm --filter @cassetta/mobile android`.
