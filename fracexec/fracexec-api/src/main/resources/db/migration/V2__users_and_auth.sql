-- V2: Authentication tables
-- Story 1.2 — User Authentication & Role System

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('EXECUTIVE', 'PME', 'ADMIN')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraints (in addition to the UNIQUE column constraint on users.email)
ALTER TABLE refresh_tokens        ADD CONSTRAINT uq_refresh_tokens_token_hash        UNIQUE (token_hash);
ALTER TABLE password_reset_tokens ADD CONSTRAINT uq_password_reset_tokens_token_hash UNIQUE (token_hash);

CREATE INDEX idx_users_email                      ON users(email);
CREATE INDEX idx_refresh_tokens_token_hash        ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user_id           ON refresh_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
