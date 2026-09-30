# BeanQuest

[![License: MIT](https://img.shields.io/github/license/hanpeter/beanquest?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/v/release/hanpeter/beanquest?logo=github&style=flat-square)](https://github.com/hanpeter/beanquest/releases/latest)
[![Python Version](https://img.shields.io/python/required-version-toml?tomlFilePath=https://raw.githubusercontent.com/hanpeter/beanquest/main/pyproject.toml&logo=python&style=flat-square)](https://www.python.org/downloads/)
[![Node Version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/hanpeter/beanquest/main/frontend/package.json&query=$.engines.node&label=node&logo=node.js&style=flat-square)](https://nodejs.org)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io%2Fhanpeter%2Fbeanquest-blue?logo=docker&style=flat-square)](https://github.com/hanpeter/beanquest/pkgs/container/beanquest)
[![Last commit](https://img.shields.io/github/last-commit/hanpeter/beanquest?logo=github&style=flat-square)](https://github.com/hanpeter/beanquest/commits)
[![Test](https://github.com/hanpeter/beanquest/actions/workflows/test.yml/badge.svg?style=flat-square)](https://github.com/hanpeter/beanquest/actions/workflows/test.yml)
[![Build](https://github.com/hanpeter/beanquest/actions/workflows/build.yml/badge.svg?style=flat-square)](https://github.com/hanpeter/beanquest/actions/workflows/build.yml)

A self-hosted journal to track beans, roasters, brewing gear, and tasting for coffee sourcing, roasting, and extraction tracking.

## Table of Contents

- [Purpose](#purpose)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
  - [Option 1: Use Docker](#option-1-use-docker)
  - [Option 2: Install from Source](#option-2-install-from-source)
- [Usage](#usage)
  - [Option 1: Use Docker](#option-1-use-docker-1)
  - [Option 2: Run Locally](#option-2-run-locally)
  - [Configuration](#configuration)
  - [API](#api)
    - [Auth](#auth)
- [Contributing](#contributing)

## Purpose

BeanQuest tracks the whole loop of a cup of coffee: the roaster that roasted it, the gear used to brew it, and a tasting log tying the two together with notes and a rating.

| Resource | What it tracks |
|---|---|
| Brewing Methods | Brewing mechanism (e.g. V60, espresso machine) and grinder used (e.g. Commandante) |
| Roasting Methods | Roaster (e.g. home-roasting with a drum roaster or a local roaster) |
| Logs | Tasting journal: bean name, process, target roast level, linked roasting + brewing method, roasting notes, grinder setting, 0-5 rating, general notes, date logged |

Data is per-user: sign up or log in with an email and password, and you only see your own methods and logs.

The app is a layered FastAPI service (`api.py` → `application.py` → `db.py` raw SQL over psycopg → Pydantic models) that also serves the built React SPA, so the whole thing runs as one process.

## Tech Stack

- **Backend:** FastAPI, Uvicorn, psycopg 3 (connection pool), Pydantic v2, PostgreSQL 17, bcrypt password hashing, PyJWT access tokens
- **Frontend:** React 19, TypeScript, Vite 8, MUI v9
- **Packaging:** Poetry (backend), npm (frontend), single multi-stage distroless Docker image

## Installation

### Option 1: Use Docker

Pre-built images are published to GHCR on tagged releases:

```bash
docker pull ghcr.io/hanpeter/beanquest:latest
```

Or build the image locally:

```bash
docker build -f docker/beanquest/Dockerfile -t beanquest .
```

### Option 2: Install from Source

Prerequisites: Docker (for Postgres), [Poetry](https://python-poetry.org/), and Node `lts/krypton` (see `.nvmrc`).

```bash
poetry install
cd frontend && npm ci
```

## Usage

### Option 1: Use Docker

The container needs `DATABASE_URL` and `JWT_SECRET` (see [Configuration](#configuration)) and listens on port 8000:

```bash
docker run --rm -p 8000:8000 \
  -e DATABASE_URL="postgresql://beanquest:beanquest@host.docker.internal:5432/beanquest" \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  beanquest
```

### Option 2: Run Locally

1. Start Postgres 17:

   ```bash
   docker run -d --name beanquest-pg \
     -e POSTGRES_USER=beanquest -e POSTGRES_PASSWORD=beanquest -e POSTGRES_DB=beanquest \
     -p 5432:5432 -v beanquest-pgdata:/var/lib/postgresql/data postgres:17
   ```

2. Apply the migrations (see [Database migrations](#database-migrations)):

   ```bash
   docker run --rm --network container:beanquest-pg -v "$PWD/db:/db" \
     -e DATABASE_URL="postgres://beanquest:beanquest@localhost:5432/beanquest?sslmode=disable" \
     ghcr.io/amacneil/dbmate:2.36.0 --no-dump-schema migrate
   ```

3. Build the frontend (outputs into `beanquest/static/`, which the API serves):

   ```bash
   cd frontend && npm ci && npm run build
   ```

4. Run the API:

   ```bash
   DATABASE_URL="postgresql://beanquest:beanquest@localhost:5432/beanquest" \
     JWT_SECRET="$(openssl rand -hex 32)" \
     poetry run uvicorn beanquest.api:app --reload
   ```

5. Open `http://127.0.0.1:8000`.

For frontend-only iteration, run `npm run dev` in `frontend/` instead of step 3. Vite dev-serves the SPA and proxies `/api` requests to `http://localhost:8000`.

### Database migrations

Migrations live in `db/migrations/` and are applied with [dbmate](https://github.com/amacneil/dbmate). Each file has a `-- migrate:up` and a `-- migrate:down` section, and runs in one transaction. Applied versions are recorded in the `schema_migrations` table.

Create a migration with the same image used in step 2, swapping `migrate` for `new <name>`:

```bash
docker run --rm -v "$PWD/db:/db" ghcr.io/amacneil/dbmate:2.36.0 new add_thing_table
```

- `CREATE INDEX CONCURRENTLY` can't run in a transaction. Start that file with `-- migrate:up transaction:false`.
- The six baseline migrations mirror the original schema and refuse to roll back. Write a real `-- migrate:down` for new ones.
- dbmate takes no lock, so run it from one place at a time. Never run it at app startup.

On a release tag, CI builds a separate `beanquest-migrator` image (dbmate and the migrations only). A one-off Fly machine runs `migrate` with the app's `DATABASE_URL` secret before the app deploys, and a failed migration stops the deploy. The app image contains neither dbmate nor the migrations. The URL needs `sslmode=disable` if the database server has SSL off.

### Configuration

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string, e.g. `postgresql://beanquest:beanquest@localhost:5432/beanquest`. The app fails to start without it. |
| `JWT_SECRET` | Yes | Secret used to sign access tokens. The app fails to start without it. Changing it invalidates all issued tokens. |
| `ACCESS_TOKEN_TTL_SECONDS` | No | Access token lifetime in seconds. Defaults to `14400` (4 hours). |

Host and port are not read from the environment: they're set on the `uvicorn` command line (`--host`, `--port`).

### API

All resources live under `/api/v1`. Every resource route requires an `Authorization: Bearer <token>` header (a missing, invalid, or expired token returns `401`) and only returns or modifies the caller's own records. They follow the same CRUD shape:

- `brewing-methods`
- `roasting-methods`
- `past-logs`

Each supports `GET` (list), `POST` (create, `201`), `GET /{id}`, `PUT /{id}`, and `DELETE /{id}` (`204`). A missing `{id}` returns `404`; deleting a roasting or brewing method still referenced by a log returns `409` (the schema uses `ON DELETE RESTRICT`).

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "you@example.com", "password": "your-password"}' | jq -r .access_token)

curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/v1/brewing-methods

curl -X POST http://127.0.0.1:8000/api/v1/roasting-methods \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"roaster_name": "Sey Coffee", "description": "Brooklyn-based"}'
```

#### Auth

Under `/api/v1/auth`:

| Endpoint | Description |
|---|---|
| `POST /lookup` | Body `{"email"}`. Returns `{"exists": bool}`; the frontend uses it to choose between login and signup. |
| `POST /signup` | Body `{"first_name", "last_name", "email", "password"}`. Returns `201` and an access token. Passwords need 10+ characters and at least 2 of: lowercase, uppercase, number, special character. |
| `POST /login` | Body `{"email", "password"}`. Returns an access token. A wrong password returns `401` with `attempts_left`; after 5 failures the account is locked for 5 minutes and returns `429` with a `Retry-After` header. |
| `GET /me` | Returns the authenticated user. |

Emails are trimmed and lowercased. Tokens are returned as `{"access_token", "token_type": "bearer"}`. There is no password-change or profile-update endpoint yet.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. CI (`test.yml`) runs the same checks on every PR:

```bash
# backend
poetry run pycodestyle .
poetry run pytest

# frontend
cd frontend
npx tsc -b
npm run test:coverage
```

Backend coverage is gated at 95% (`setup.cfg`); frontend coverage is gated at 95% on `src/logic/**` (`vite.config.ts`). CI (`build.yml`) also builds the Docker image on every PR and, on tagged releases, publishes it to GHCR.
