FROM node:24-slim AS frontend-builder

WORKDIR /beanquest

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/index.html frontend/tsconfig.json frontend/vite.config.ts ./
COPY frontend/src ./src

RUN npm run build

FROM python:3.13-slim AS backend-builder

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_NO_CACHE=1 \
    PATH="/opt/poetry/bin:$PATH"
RUN python3 -m venv /opt/poetry && \
    /opt/poetry/bin/pip install --no-cache-dir poetry==2.4.1

WORKDIR /beanquest

COPY pyproject.toml poetry.lock ./
RUN poetry install --without dev --no-root

COPY beanquest/ ./beanquest/
COPY README.md ./

RUN poetry install --without dev

# Fix Python symlinks to match distroless Python path
RUN rm -f /beanquest/.venv/bin/python* && \
    ln -s /usr/bin/python /beanquest/.venv/bin/python && \
    ln -s /usr/bin/python /beanquest/.venv/bin/python3 && \
    ln -s /usr/bin/python /beanquest/.venv/bin/python3.13

FROM gcr.io/distroless/python3-debian13 AS runtime

WORKDIR /beanquest

COPY --from=backend-builder /beanquest/.venv /beanquest/.venv
COPY --from=backend-builder /beanquest/beanquest /beanquest/beanquest
COPY --from=frontend-builder /beanquest/static/ /beanquest/beanquest/static/

EXPOSE 8000
ENTRYPOINT ["/beanquest/.venv/bin/uvicorn", "beanquest.api:app", "--host", "0.0.0.0", "--port", "8000"]
