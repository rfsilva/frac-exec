-- Story 4.5: Oportunidades do executivo
CREATE TABLE executive_opportunities (
    id                              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    shortlist_executive_id          UUID        NOT NULL REFERENCES shortlist_executives(id),
    executive_profile_id            UUID        NOT NULL REFERENCES executive_profiles(id),
    need_id                         UUID        NOT NULL REFERENCES needs(id),
    status                          VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    decline_reason                  TEXT,
    interested_at                   TIMESTAMPTZ,
    declined_at                     TIMESTAMPTZ,
    expires_at                      TIMESTAMPTZ NOT NULL,
    retracted_at                    TIMESTAMPTZ,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exec_opp_profile_status ON executive_opportunities(executive_profile_id, status);
CREATE INDEX idx_exec_opp_need_id        ON executive_opportunities(need_id);

-- Story 4.6: Thread de mediação
CREATE TABLE mediation_messages (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    need_id     UUID        NOT NULL REFERENCES needs(id),
    sender_role VARCHAR(20) NOT NULL,
    sender_id   UUID,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mediation_messages_need_id ON mediation_messages(need_id);
