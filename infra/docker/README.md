# Docker Operations Notes

## Build

```bash
# From repo root
docker compose build
```

## Run

```bash
# From repo root
docker compose up -d
```

## Env Vars

Create `apps/orchestrator/.env` from `.env.example`:

```bash
cp apps/orchestrator/.env.example apps/orchestrator/.env
# Fill in required values
```

Required variables:
- `UPWORK_ACCESS_TOKEN`
- `UPWORK_TENANT_ID`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Optional:
- `ENABLE_REAL_SUBMISSION=true` — enables real Upwork submission (disabled by default)
- `DATABASE_PATH=/app/data/state.sqlite`

## Secrets

Postgres password is read from `infra/docker/secrets/postgres_password.txt`.
Generate it:

```bash
openssl rand -base64 32 > infra/docker/secrets/postgres_password.txt
chmod 600 infra/docker/secrets/postgres_password.txt
```

## Submission Safety

`ENABLE_REAL_SUBMISSION` is **not set** by default.
Set it to `true` only when you want real Upwork submissions to be attempted.
The `SubmissionGateRequest` gate is created before any submission attempt regardless of this flag.

## OpenClaw Integration

OpenClaw connects to this suite via a **narrow API surface only**.

Do:
- scoped job triggers via orchestrator entrypoints
- status reads via DB or state queries
- approval inputs via Telegram or CLI

Don't:
- `docker exec` into containers
- mount docker.sock
- control Docker lifecycle from OpenClaw agent
- assume OpenClaw controls container networking

## Health Checks

- `postgres`: `pg_isready`
- `redis`: `redis-cli ping`
- `orchestrator`: file access check on `DATABASE_PATH`
- `agents`: simple node process check (stub)

## Volumes

- `orchestrator-data` — SQLite database and capability files
- `postgres-data` — Postgres data directory
- `redis-data` — Redis AOF data

## Ports

No ports exposed by default (services are internal).
To expose the orchestrator:
```yaml
services:
  orchestrator:
    ports:
      - "3000:3000"
```
