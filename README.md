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
- [Contributing](#contributing)

## Purpose

BeanQuest tracks the whole loop of a cup of coffee: the roaster that roasted it, the gear used to brew it, and a tasting log tying the two together with notes and a rating.

| Resource | What it tracks |
|---|---|
| Brewing Methods | Brewing mechanism (e.g. V60, espresso machine) and grinder used (e.g. Commandante) |
| Roasting Methods | Roaster (e.g. home-roasting with a drum roaster or a local roaster) |
| Logs | Tasting journal: bean name, process, target roast level, linked roasting + brewing method, roasting notes, grinder setting, 0-5 rating, general notes, date logged |

The app is a layered FastAPI service (`api.py` → `application.py` → `db.py` raw SQL over psycopg → Pydantic models) that also serves the built React SPA, so the whole thing runs as one process.

## Tech Stack

- **Backend:** FastAPI, Uvicorn, psycopg 3 (connection pool), Pydantic v2, PostgreSQL 17
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

The container needs a `DATABASE_URL` (see [Configuration](#configuration)) and listens on port 8000:

```bash
docker run --rm -p 8000:8000 \
  -e DATABASE_URL="postgresql://beanquest:beanquest@host.docker.internal:5432/beanquest" \
  beanquest
```

### Option 2: Run Locally

1. Start Postgres 17:

   ```bash
   docker run -d --name beanquest-pg \
     -e POSTGRES_USER=beanquest -e POSTGRES_PASSWORD=beanquest -e POSTGRES_DB=beanquest \
     -p 5432:5432 -v beanquest-pgdata:/var/lib/postgresql/data postgres:17
   ```

2. Apply the schema:

   ```bash
   docker exec -i beanquest-pg psql -U beanquest -d beanquest < migrations/0001.initial-schema.sql
   ```

3. Build the frontend (outputs into `beanquest/static/`, which the API serves):

   ```bash
   cd frontend && npm ci && npm run build
   ```

4. Run the API:

   ```bash
   DATABASE_URL="postgresql://beanquest:beanquest@localhost:5432/beanquest" \
     poetry run uvicorn beanquest.api:app --reload
   ```

5. Open `http://127.0.0.1:8000`.

For frontend-only iteration, run `npm run dev` in `frontend/` instead of step 3. Vite dev-serves the SPA and proxies `/api` requests to `http://localhost:8000`.

### Configuration

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string, e.g. `postgresql://beanquest:beanquest@localhost:5432/beanquest`. The app fails to start without it. |

Host and port are not read from the environment: they're set on the `uvicorn` command line (`--host`, `--port`).

### API

All resources live under `/api/v1` and follow the same CRUD shape:

- `brewing-methods`
- `roasting-methods`
- `past-logs`

Each supports `GET` (list), `POST` (create, `201`), `GET /{id}`, `PUT /{id}`, and `DELETE /{id}` (`204`). A missing `{id}` returns `404`; deleting a roasting or brewing method still referenced by a log returns `409` (the schema uses `ON DELETE RESTRICT`).

```bash
curl http://127.0.0.1:8000/api/v1/brewing-methods

curl -X POST http://127.0.0.1:8000/api/v1/roasting-methods \
  -H 'Content-Type: application/json' \
  -d '{"roaster_name": "Sey Coffee", "description": "Brooklyn-based"}'
```

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
