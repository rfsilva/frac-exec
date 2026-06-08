CREATE TABLE needs (
    id                     UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id             UUID         NOT NULL REFERENCES companies(id),
    clevel_type            VARCHAR(20)  NOT NULL,
    scope_days_per_month   VARCHAR(10)  NOT NULL,
    estimated_duration     VARCHAR(50),
    desired_start          DATE,
    challenge_description  TEXT         NOT NULL,
    expected_result        TEXT         NOT NULL,
    confidential_context   TEXT,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_needs_company_id ON needs(company_id);
CREATE INDEX idx_needs_status     ON needs(status);
