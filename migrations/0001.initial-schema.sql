-- depends:

CREATE TABLE IF NOT EXISTS users (
    id             SERIAL PRIMARY KEY,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One row per (user, login method) they have set up. 'password' now;
-- 'google' / 'apple' / etc. later, without touching this shape.
CREATE TABLE IF NOT EXISTS auth_identities (
    id             SERIAL PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider       VARCHAR(20) NOT NULL,
    provider_uid   VARCHAR(255),
    password_hash  VARCHAR(255),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider, provider_uid),
    UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS brewing_methods (
    id            SERIAL PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    method_name   VARCHAR(100) NOT NULL,
    machine_used  VARCHAR(255),
    grinder_used  VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roasting_methods (
    id           SERIAL PRIMARY KEY,
    user_id      INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    roaster_name VARCHAR(100) NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS past_logs (
    id                  SERIAL PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    bean_name           VARCHAR(255) NOT NULL,
    process             VARCHAR(50)  NOT NULL,
    target_roast_level  VARCHAR(100),
    roasting_method_id  INT NOT NULL REFERENCES roasting_methods (id) ON DELETE RESTRICT,
    brewing_method_id   INT NOT NULL REFERENCES brewing_methods (id)  ON DELETE RESTRICT,
    roasting_notes      TEXT,
    grinder_setting     VARCHAR(100) NOT NULL,
    rating_score        INT NOT NULL CHECK (rating_score BETWEEN 0 AND 5),
    general_notes       TEXT,
    date_logged         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS brewing_methods_user_id_idx ON brewing_methods (user_id);
CREATE INDEX IF NOT EXISTS roasting_methods_user_id_idx ON roasting_methods (user_id);
CREATE INDEX IF NOT EXISTS past_logs_user_id_idx ON past_logs (user_id);

-- Tracks failed password-login attempts per email for rate limiting.
-- Keyed by raw email (not a users FK) — has to track attempts against
-- emails that may not correspond to a real account too.
CREATE TABLE IF NOT EXISTS login_attempts (
    email          VARCHAR(255) PRIMARY KEY,
    failure_count  INT NOT NULL DEFAULT 0,
    locked_until   TIMESTAMPTZ,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
