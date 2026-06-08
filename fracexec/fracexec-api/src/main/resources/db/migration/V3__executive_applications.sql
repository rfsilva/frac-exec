-- V3: Executive application tables
-- Story 2.1 — Public Application Form (Stepper)

CREATE TABLE executive_applications (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name         VARCHAR(255) NOT NULL,
    email             VARCHAR(255) NOT NULL,
    linkedin_url      VARCHAR(500),
    motivation        TEXT,
    lgpd_consent      BOOLEAN      NOT NULL DEFAULT false,
    lgpd_consent_at   TIMESTAMPTZ,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING','UNDER_REVIEW','APPROVED','REJECTED')),
    rejection_reason  TEXT,
    can_reapply_after TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE application_positions (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID         NOT NULL REFERENCES executive_applications(id) ON DELETE CASCADE,
    role_title      VARCHAR(100) NOT NULL,
    company_name    VARCHAR(255),
    period_start    DATE         NOT NULL,
    period_end      DATE,
    team_size       VARCHAR(50),
    revenue_managed VARCHAR(100),
    position_order  INT          NOT NULL DEFAULT 0
);

CREATE TABLE application_references (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID         NOT NULL REFERENCES executive_applications(id) ON DELETE CASCADE,
    ref_name        VARCHAR(255) NOT NULL,
    ref_role        VARCHAR(100) NOT NULL,
    ref_contact     VARCHAR(255) NOT NULL
);

CREATE INDEX idx_executive_applications_email  ON executive_applications(email);
CREATE INDEX idx_executive_applications_status ON executive_applications(status);
