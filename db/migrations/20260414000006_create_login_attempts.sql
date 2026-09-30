-- migrate:up
-- Tracks failed password-login attempts per email for rate limiting.
-- Keyed by raw email (not a users FK) — has to track attempts against
-- emails that may not correspond to a real account too.
CREATE TABLE IF NOT EXISTS login_attempts (
    email          VARCHAR(255) PRIMARY KEY,
    failure_count  INT NOT NULL DEFAULT 0,
    locked_until   TIMESTAMPTZ,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- migrate:down
-- Baseline of a pre-dbmate schema; prod holds out-of-repo hardening on these objects.
DO $$ BEGIN RAISE EXCEPTION 'baseline migration: rollback not supported'; END $$;
