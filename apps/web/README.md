# Cassette

My own little music player — a place to keep the songs I love and stream them from anywhere, without a subscription.

![Cassette](.github/assets/screenshot.png)

## Getting Started

```bash
git clone https://github.com/kato/cassette
cd cassette
bun install
```

## Running Locally

Create a `.env` file in the project root:

```bash
# MongoDB Atlas — holds the library (tracks, playlists, albums)
MONGO_URL="mongodb+srv://user:pass@cluster/cassette"

# Cloudflare R2 — stores the audio files
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="cassette"
R2_PUBLIC_URL="https://media.example.com"   # public base URL for the bucket
R2_ACCOUNT_ID="..."                          # account id… or set R2_ENDPOINT below
# R2_ENDPOINT="https://<account>.r2.cloudflarestorage.com"

# Optional — gate the whole app behind one password (leave unset to keep it open)
AUTH_PASSWORD="change-me"

# Optional — pull tracks in by URL from an external importer service
MUSIC_IMPORTER_URL="https://importer.example.com"
IMPORTER_API_KEY="..."
```

New to R2? The key, secret, and endpoint all come from an S3-compatible API token on your bucket — Cloudflare's [R2 S3 API guide](https://developers.cloudflare.com/r2/api/s3/api/) walks through it.

Push the database schema:

```bash
bun run db:push
```

Add audio files (`.mp3`, `.m4a`, `.flac`, `.ogg`, `.wav`) to a top-level `tracks/` folder (git ignored). One easy way to grab a song is [`yt-dlp`](https://github.com/yt-dlp/yt-dlp):

```bash
yt-dlp -x --audio-format mp3 --embed-thumbnail -o "tracks/%(title)s.%(ext)s" "<url>"
```

Then ingest them — this uploads each file to R2, reads its metadata and artwork, and asks (right in the terminal) whether to drop the new tracks into the library or a playlist:

```bash
bun run ingest
```

Already have audio sitting in your bucket? Register anything not yet in the database:

```bash
bun run sync
```

Finally, start the dev server:

```bash
bun run dev
```

You can browse the database contents with Prisma Studio:

```bash
bun run db:studio
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Why it's built this way

I wanted this to run for free, basically forever, on someone else's hardware:

- **MongoDB Atlas** holds the library. Its free tier is generous enough that a personal collection never comes close to the limit.
- **Cloudflare R2** stores the audio. The free tier has plenty of storage and — the part that matters — **zero egress fees**, so streaming my music doesn't quietly run up a bill.
- **[coss.com/ui](https://coss.com/ui)** for the components, so the interface stays consistent without hand-rolling every button and dialog.
- **[TanStack Virtual](https://tanstack.com/virtual)** virtualizes the track table, so the library scrolls smoothly whether it holds 50 songs or 5,000.

## What it does

**Listening.** Your whole collection lives in one virtualized table that stays smooth
from 50 tracks to 5,000. Click a song to play, scrub the progress bar to seek, and the
now-playing bar follows you everywhere. Favorites are one tap away in their own view.

**Organizing.** Group songs into playlists and albums, reorder them by dragging, and
hide the albums you'd rather not see.

**Getting music in.** Drop files into `tracks/` and `bun run ingest` uploads and tags
them; `bun run sync` adopts anything already in your bucket. There's also an optional
URL importer for pulling tracks in from elsewhere.

**Keeping it yours.** Set `AUTH_PASSWORD` and the whole app sits behind a single
password — leave it unset and it stays open. Works the same on a phone as on a desktop.

## License

[MIT](LICENSE) — do whatever you like with it.
