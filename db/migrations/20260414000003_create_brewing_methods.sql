-- migrate:up
CREATE TABLE IF NOT EXISTS brewing_methods (
    id            SERIAL PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    method_name   VARCHAR(100) NOT NULL,
    machine_used  VARCHAR(255),
    grinder_used  VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS brewing_methods_user_id_idx ON brewing_methods (user_id);

-- migrate:down
-- Baseline of a pre-dbmate schema; prod holds out-of-repo hardening on these objects.
DO $$ BEGIN RAISE EXCEPTION 'baseline migration: rollback not supported'; END $$;
