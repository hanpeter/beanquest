-- migrate:up
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

CREATE INDEX IF NOT EXISTS past_logs_user_id_idx ON past_logs (user_id);

-- migrate:down
-- Baseline of a pre-dbmate schema; prod holds out-of-repo hardening on these objects.
DO $$ BEGIN RAISE EXCEPTION 'baseline migration: rollback not supported'; END $$;
