-- migrate:up
CREATE TABLE IF NOT EXISTS users (
    id             SERIAL PRIMARY KEY,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Addresses are normalized to lowercase at the API boundary (auth.NormalizedEmail);
-- this index enforces the invariant in the database too, so a path that forgets
-- to normalize fails loudly instead of creating a second account for one address.
-- Uniqueness on LOWER(email) already implies uniqueness on email, so there's no
-- separate plain UNIQUE constraint on the column — it would be redundant.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

-- migrate:down
-- Baseline of a pre-dbmate schema; prod holds out-of-repo hardening on these objects.
DO $$ BEGIN RAISE EXCEPTION 'baseline migration: rollback not supported'; END $$;
