FROM oven/bun:1 AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    nodejs \
    ca-certificates \
  && pip3 install --break-system-packages yt-dlp spotdl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

COPY prisma ./prisma
RUN bun run db:generate

COPY . .

ENV NODE_ENV=production
ENV TEMP_DIR=/tmp/import

CMD ["bun", "run", "src/server.ts"]
