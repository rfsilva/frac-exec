CREATE TABLE shortlists (
    id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    need_id    UUID        NOT NULL UNIQUE REFERENCES needs(id),
    status     VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shortlist_executives (
    id                    UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    shortlist_id          UUID        NOT NULL REFERENCES shortlists(id),
    executive_profile_id  UUID        NOT NULL REFERENCES executive_profiles(id),
    conflict_status       VARCHAR(20) NOT NULL DEFAULT 'CLEAR',
    conflict_decided_by   UUID,
    conflict_decided_at   TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shortlists_need_id                 ON shortlists(need_id);
CREATE INDEX idx_shortlist_executives_shortlist_id  ON shortlist_executives(shortlist_id);
