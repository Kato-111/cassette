# music-importer

Background import service for the music-player app. Downloads YouTube videos/playlists via yt-dlp and Spotify playlists/albums/tracks via spotdl, uploads audio to Cloudflare R2, and writes Track records to MongoDB.

## Prerequisites

- [Bun](https://bun.sh)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp), [spotdl](https://github.com/spotDL/spotify-downloader), and ffmpeg (installed automatically in Docker)
- Redis (local or via Docker Compose)
- Same MongoDB and R2 credentials as the main `music-player` app

## Setup

```bash
cd music-importer
cp .env.example .env
# Copy MONGO_URL and R2_* from the parent app .env, then set IMPORTER_API_KEY
# Optional: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET for spotdl (defaults work for most cases)
bun install
bun run db:generate
bun run db:push
```

From the main app, sync schema and push once:

```bash
cd ..
bun run db:push
```

## Main app (music-player) env

The Cassette frontend calls this service via server actions. Add to the **parent** app `.env` (and Vercel):

| Variable | Example |
|----------|---------|
| `MUSIC_IMPORTER_URL` | `http://localhost:8787` |
| `IMPORTER_API_KEY` | same value as this service's `IMPORTER_API_KEY` |

Both must be set to show **Import from URL** in the UI. The API key is server-only — never use `NEXT_PUBLIC_`.

## Local development

Terminal 1 — Redis (if not using Docker):

```bash
docker run --rm -p 6379:6379 redis:7-alpine
```

Terminal 2 — API:

```bash
bun run dev:api
```

Terminal 3 — Worker:

```bash
bun run dev:worker
```

## API

All `/import` and `/search` routes require:

```
Authorization: Bearer $IMPORTER_API_KEY
```

CORS is allowed for `http://localhost:3000` and `https://cassetta.vercel.app`.

### POST /import

```json
{
  "url": "https://www.youtube.com/playlist?list=PL...",
  "playlistId": "optional Mongo ObjectId"
}
```

Optional query param:

```
POST /import?limit=5
```

Imports only the first N tracks from a playlist (in playlist order). Ignored for single-video URLs in practice (they already import one track). Max `500`.

Returns `202` with `{ "jobId": "..." }`.

If `playlistId` is omitted, tracks are added to the library only. If provided, imported tracks are also attached to that playlist (skipping duplicates).

Example:

```bash
curl -X POST "http://localhost:8787/import?limit=3" \
  -H "Authorization: Bearer $IMPORTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/playlist?list=PL..."}'
```

### GET /import/:jobId

Poll job progress.

### GET /search

Search YouTube Music's **Songs** catalog through YouTube.js. No separate
YouTube API key is needed. The selected result is still imported with `yt-dlp`.

| Query parameter | Required | Default | Notes |
| --- | --- | --- | --- |
| `q` | yes | — | The music query to search for |
| `limit` | no | `10` | Positive integer, at most `50` |

Returns `{ "results": [...] }`, where each result has `sourceItemId`, `title`,
`artist`, `album` (when known), `durationSec`, `sourceUrl`, and `thumbnailUrl`
(when available). `sourceUrl` can be supplied to `POST /import` to import the
selected result.

```bash
curl "http://localhost:8787/search?q=daft%20punk%20around%20the%20world&limit=5" \
  -H "Authorization: Bearer $IMPORTER_API_KEY"
```

### GET /health

No auth. Returns `{ "ok": true }`.

## Troubleshooting

**Nothing on `http://localhost:8787` after `docker compose up`**

1. Confirm the URL includes the protocol: `http://localhost:8787/health` (a browser is fine for this).
2. Check containers are running: `docker compose ps`
3. Check API logs: `docker compose logs api --tail 50`

The most common cause is a missing `IMPORTER_API_KEY` in `.env`. Both the API and worker require it and will exit immediately without it.

**`Unauthorized` when importing locally**

Usually the API key in the running importer does not match the main app `.env`. Common causes:

1. **Docker still running on 8787 with stale env** — after editing `.env`, recreate containers: `docker compose down && docker compose up -d --build --force-recreate`
2. **Mixed modes** — Docker on 8787 plus `bun run dev:api` at the same time; pick one setup
3. **Next.js not restarted** — restart `bun dev` after changing `IMPORTER_API_KEY` in the parent `.env`
4. **Quoted keys in `.env`** — use `IMPORTER_API_KEY=your-key` without quotes (same value in both `music-importer/.env` and the parent `.env`)

Quick check (replace with your key):

```bash
curl -X POST http://localhost:8787/import \
  -H "Authorization: Bearer $IMPORTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

Expect `202` with a `jobId`, not `401`.

**CORS note:** `/health` works from the browser without CORS issues. `/import` routes need the `Authorization` header — use curl or your app, not a bare browser address bar.

**Worker logs `ECONNREFUSED ...:6379`**

The worker lost its Redis connection (Redis container stopped, restarted, or was still starting). Check Redis first:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs redis --tail 50
docker compose -f docker-compose.prod.yml up -d
```

Inside Compose, `REDIS_URL` must be `redis://redis:6379` (the compose file sets this; do not point at `127.0.0.1` from inside a container). If Redis keeps exiting, check VM memory (`dmesg | tail`) — Redis is often OOM-killed on small instances.

**GHCR pull returns `403 Forbidden` (even after `Login Succeeded`)**

Private GHCR returns 403 when the image is missing *or* your token cannot read packages — not only when login failed.

1. **Confirm the image was published** — GitHub → `Kato-111/music-importer` → **Actions** → **Release** workflow for tag `v1.0.0` must be green. Then check **Packages** (or [github.com/Kato-111?tab=packages](https://github.com/Kato-111?tab=packages)) for `music-importer`.
2. **Fix PAT scopes** — most common fix on the VM:
   - Classic: `read:packages` + `repo`
   - Fine-grained: **Packages (Read)** on `music-importer` (Contents + Metadata read too)
3. **Re-login and test pull alone** before `./deploy.sh`:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u Kato-111 --password-stdin
docker pull ghcr.io/kato-111/music-importer:v1.0.0
```

4. If Actions never ran, push the tag again or run **Release** manually (Actions → Release → Run workflow).

Never paste PATs into chat or shell history on shared machines — revoke any exposed token and create a new one.

## Docker Compose (local)

Build and run from source on your machine:

```bash
docker compose up -d --build
```

## Production deploy (GHCR + VM)

Images are built in GitHub Actions and published to `ghcr.io/kato-111/music-importer`. The VM only pulls pre-built images — no git clone or build step on the server.

### Release a new image

```bash
git tag v1.0.0
git push origin v1.0.0
```

Or run the **Release** workflow manually from GitHub Actions (workflow dispatch).

Tags pushed:

- `ghcr.io/kato-111/music-importer:v1.0.0` (semver tag)
- `ghcr.io/kato-111/music-importer:latest`

### VM bootstrap (one time)

1. Install Docker and the Compose plugin on your VM.
2. Create a deploy directory, e.g. `/opt/music-importer`.
3. Copy `docker-compose.prod.yml`, `deploy.sh`, and `.env.example` to the VM.
4. Create `.env` from `.env.example` (Mongo, R2, `IMPORTER_API_KEY`, etc.).
5. Set `IMAGE_TAG=v1.0.0` in `.env` to pin a release (or `latest`).
6. Log in to GHCR. **Login succeeding does not mean pull will work** — the token must be allowed to read packages.

**Classic PAT** ([tokens](https://github.com/settings/tokens) → Generate new token → classic): enable **`read:packages`** and **`repo`**.

**Fine-grained PAT**: repository access to `music-importer`, permissions **Contents (Read)**, **Metadata (Read)**, **Packages (Read)**.

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u Kato-111 --password-stdin
docker pull ghcr.io/kato-111/music-importer:v1.0.0   # verify before deploy.sh
chmod +x deploy.sh
```

7. Put TLS in front of port 8787 (Caddy or nginx) and open firewall ports `22` + `443` only.

Suggested layout:

```text
/opt/music-importer/
  docker-compose.prod.yml
  deploy.sh
  .env
```

### Deploy / rollback on the VM

```bash
cd /opt/music-importer
# edit .env → IMAGE_TAG=v1.0.1  (or keep latest)
./deploy.sh
```

Rollback: set `IMAGE_TAG` to the previous version and run `./deploy.sh` again.

### Smoke test

```bash
curl http://127.0.0.1:8787/health

curl -X POST http://127.0.0.1:8787/import \
  -H "Authorization: Bearer $IMPORTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

curl http://127.0.0.1:8787/import/<jobId> \
  -H "Authorization: Bearer $IMPORTER_API_KEY"
```

Point the music-player app at `https://your-importer-host` with the same `IMPORTER_API_KEY` (`MUSIC_IMPORTER_URL` + `IMPORTER_API_KEY` on Vercel).

### Optional: auto-deploy via SSH

Add GitHub repository secrets `VM_HOST`, `VM_USER`, and `VM_SSH_KEY`, then extend `.github/workflows/release.yml` with a deploy job that runs `./deploy.sh` over SSH after a successful push. Until those secrets exist, deploy manually on the VM.

## Architecture

- **api** — Hono HTTP server, enqueues BullMQ jobs
- **worker** — processes import jobs; tracks within a playlist run in parallel (`MAX_CONCURRENT_ITEMS`, default 3)
- **redis** — BullMQ backend

Spotify URLs are supported via [spotdl](https://github.com/spotDL/spotify-downloader) (matches Spotify metadata to YouTube audio).

## Tests

```bash
bun run test
```
