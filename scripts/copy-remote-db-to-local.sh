#!/usr/bin/env bash
# Copy a remote Postgres database into a local database using pg_dump / pg_restore.
#
# Prerequisites: Homebrew `postgresql` client tools (pg_dump, pg_restore), or equivalent.
#
# Typical workflow (local Postgres already installed, e.g. Homebrew):
#   1. Create an empty database (adjust user/host as needed):
#        createdb mccapes_local
#      Or: psql postgres -c 'CREATE DATABASE mccapes_local;'
#   2. Set the local connection URL (must match your role and port):
#        export LOCAL_DATABASE_URL="postgresql://YOUR_USER@127.0.0.1:5432/mccapes_local"
#   3. Copy remote → local (uses DATABASE_URL from .env as remote unless REMOTE_DATABASE_URL is set):
#        pnpm exec dotenvx run -- pnpm db:copy-remote-local
#
# Or set both URLs explicitly:
#   REMOTE_DATABASE_URL="postgresql://..." LOCAL_DATABASE_URL="postgresql://..." pnpm db:copy-remote-local
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REMOTE="${REMOTE_DATABASE_URL:-${DATABASE_URL:-}}"
LOCAL="${LOCAL_DATABASE_URL:-}"

if [[ -z "$REMOTE" ]]; then
  echo "Set REMOTE_DATABASE_URL or DATABASE_URL (remote) and LOCAL_DATABASE_URL." >&2
  exit 1
fi
if [[ -z "$LOCAL" ]]; then
  echo "Set LOCAL_DATABASE_URL, e.g. postgresql://YOUR_USER@127.0.0.1:5432/mccapes_local" >&2
  exit 1
fi
if [[ "$REMOTE" == "$LOCAL" ]]; then
  echo "REMOTE and LOCAL URLs must differ; refusing to overwrite remote." >&2
  exit 1
fi

command -v pg_dump >/dev/null || {
  echo "pg_dump not found. Install PostgreSQL client tools (e.g. brew install libpq)." >&2
  exit 1
}
command -v pg_restore >/dev/null || {
  echo "pg_restore not found." >&2
  exit 1
}

DUMP="${TMPDIR:-/tmp}/mccapes-pg-copy-$$.dump"

cleanup() {
  rm -f "$DUMP"
}
trap cleanup EXIT

echo "Dumping remote database..."
pg_dump "$REMOTE" \
  --format=custom \
  --no-owner \
  --no-acl \
  -f "$DUMP"

echo "Restoring into local database (drops existing objects in that database)..."
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  -d "$LOCAL" \
  "$DUMP"

echo "Applying Prisma migrations on local DATABASE_URL..."
export DATABASE_URL="$LOCAL"
pnpm exec prisma migrate deploy
pnpm exec prisma generate

echo "Done. Use LOCAL_DATABASE_URL as DATABASE_URL when running the app (e.g. in .env.local)."
