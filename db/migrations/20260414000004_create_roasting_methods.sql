-- migrate:up
CREATE TABLE IF NOT EXISTS roasting_methods (
    id           SERIAL PRIMARY KEY,
    user_id      INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    roaster_name VARCHAR(100) NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS roasting_methods_user_id_idx ON roasting_methods (user_id);

-- migrate:down
-- Baseline of a pre-dbmate schema; prod holds out-of-repo hardening on these objects.
DO $$ BEGIN RAISE EXCEPTION 'baseline migration: rollback not supported'; END $$;
