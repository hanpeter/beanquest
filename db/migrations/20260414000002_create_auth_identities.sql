-- migrate:up
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

-- migrate:down
-- Baseline of a pre-dbmate schema; prod holds out-of-repo hardening on these objects.
DO $$ BEGIN RAISE EXCEPTION 'baseline migration: rollback not supported'; END $$;
