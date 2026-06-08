-- V5: Executive profile tables
-- Story 2.4 — Executive Profile Completion

CREATE TABLE executive_profiles (
    id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_key                   VARCHAR(500),
    bio                         TEXT,
    experience_summary          TEXT,
    company_visibility          JSONB        NOT NULL DEFAULT '{}',
    availability_days_per_month INT          NOT NULL DEFAULT 20,
    profile_status              VARCHAR(20)  NOT NULL DEFAULT 'INACTIVE'
                                    CHECK (profile_status IN ('ACTIVE','INACTIVE','SUSPENDED')),
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE executive_specialties (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id  UUID        NOT NULL REFERENCES executive_profiles(id) ON DELETE CASCADE,
    specialty   VARCHAR(50) NOT NULL
);

CREATE TABLE executive_sectors (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id  UUID         NOT NULL REFERENCES executive_profiles(id) ON DELETE CASCADE,
    sector_name VARCHAR(100) NOT NULL
);

CREATE UNIQUE INDEX idx_executive_profiles_user_id ON executive_profiles(user_id);
CREATE        INDEX idx_executive_profiles_status  ON executive_profiles(profile_status);
