#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example and fill in secrets." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

compose=(docker compose -f docker-compose.prod.yml)
image="ghcr.io/kato-111/music-importer:${IMAGE_TAG:-latest}"

if ! grep -q '"ghcr.io"' "${HOME}/.docker/config.json" 2>/dev/null; then
  echo "Not logged in to ghcr.io." >&2
  echo "Run: echo \"\$GHCR_TOKEN\" | docker login ghcr.io -u Kato-111 --password-stdin" >&2
  exit 1
fi

echo "Pulling ${image}..."
if ! "${compose[@]}" pull; then
  echo >&2
  echo "Pull failed. For 403 Forbidden after 'Login Succeeded', check:" >&2
  echo "  1. GitHub → music-importer → Actions: Release workflow finished green for tag ${IMAGE_TAG:-latest}" >&2
  echo "  2. GitHub → your profile → Packages: ghcr.io/kato-111/music-importer exists" >&2
  echo "  3. PAT scopes: classic token needs read:packages AND repo; fine-grained needs Packages (Read) on music-importer" >&2
  echo "  4. Re-login: echo \"\$GHCR_TOKEN\" | docker login ghcr.io -u Kato-111 --password-stdin" >&2
  exit 1
fi

echo "Starting services..."
"${compose[@]}" up -d

"${compose[@]}" ps

health_url="http://127.0.0.1:${PORT:-8787}/health"
echo "Health check: ${health_url}"
curl -fsS "${health_url}"
echo
echo "Deployed ${IMAGE_TAG:-latest}"
