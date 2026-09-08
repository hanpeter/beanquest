-- depends:

CREATE TABLE IF NOT EXISTS users (
    id             SERIAL PRIMARY KEY,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
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
