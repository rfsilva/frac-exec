CREATE TABLE engagements (
    id                    UUID           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    need_id               UUID           NOT NULL REFERENCES needs(id),
    executive_profile_id  UUID           NOT NULL REFERENCES executive_profiles(id),
    status                VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    monthly_value         NUMERIC(12,2),
    scope_days_per_month  INT,
    duration_months       INT,
    started_at            TIMESTAMPTZ,
    created_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_engagements_need_id              ON engagements(need_id);
CREATE INDEX idx_engagements_executive_profile_id ON engagements(executive_profile_id);
CREATE INDEX idx_engagements_status               ON engagements(status);

CREATE TABLE contracts (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    engagement_id       UUID        NOT NULL UNIQUE REFERENCES engagements(id),
    storage_key         VARCHAR(500),
    signed_by_pme       BOOLEAN     NOT NULL DEFAULT FALSE,
    signed_by_executive BOOLEAN     NOT NULL DEFAULT FALSE,
    monthly_value       NUMERIC(12,2),
    scope_days_per_month INT,
    duration_months     INT,
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    fully_signed_at     TIMESTAMPTZ
);

CREATE INDEX idx_contracts_engagement_id ON contracts(engagement_id);
