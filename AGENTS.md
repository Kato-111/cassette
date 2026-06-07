## Cursor Cloud specific instructions

### Project Overview

Cassette is a personal audio library / music player built with **Next.js 16** (App Router, React 19), **Prisma** (MongoDB), and **Cloudflare R2** (S3-compatible object storage). The package manager is **Bun** (lockfile: `bun.lock`).

### Services Required

| Service | How to run locally |
|---------|-------------------|
| **MongoDB 7** (replica set) | `docker run -d --name mongo -p 27017:27017 mongo:7 --replSet rs0` then init: `docker exec mongo mongosh --quiet --eval 'rs.initiate()'` |
| **MinIO** (S3-compatible, replaces R2) | `docker run -d --name minio -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin minio/minio:latest server /data --console-address ":9001"` |
| **Next.js dev server** | `bun run dev` (port 3000) |

### Critical: MongoDB must be a replica set

Prisma with MongoDB requires replica set transactions. A standalone `mongod` will cause server actions to fail with transaction errors. Always start MongoDB with `--replSet rs0` and run `rs.initiate()`.

### Environment Variables (.env)

```
MONGO_URL=mongodb://localhost:27017/cassette?replicaSet=rs0&directConnection=true
R2_ACCESS_KEY_ID=minioadmin
R2_SECRET_ACCESS_KEY=minioadmin
R2_BUCKET_NAME=cassette
R2_PUBLIC_URL=http://localhost:9000/cassette
R2_ENDPOINT=http://localhost:9000
```

### MinIO bucket setup

After starting MinIO, create the bucket:
```
docker exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec minio mc mb local/cassette
docker exec minio mc anonymous set download local/cassette
```

### Common Commands

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Dev server | `bun run dev` |
| Lint | `bun run lint` |
| Typecheck | `bun run typecheck` |
| Tests | `bun run test` |
| Push DB schema | `bun run db:push` |
| Prisma Studio | `bun run db:studio` |

### Notes

- Tests (Vitest + happy-dom) do **not** require MongoDB or MinIO — they use mocks.
- Lint produces warnings (not errors) for `react-hooks/set-state-in-effect` and similar rules; these are expected.
- The `r2.ts` module throws on import if R2 env vars are missing; the `.env` must be present for the dev server to start.
- Docker is required for running MongoDB and MinIO locally. The Docker daemon needs `fuse-overlayfs` storage driver and `iptables-legacy` in the Cloud Agent VM environment.
