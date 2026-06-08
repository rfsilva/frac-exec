CREATE TABLE executive_clients (
    id                   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    executive_profile_id UUID         NOT NULL REFERENCES executive_profiles(id),
    cnae_2digit          CHAR(2)      NOT NULL,
    region_state         CHAR(2)      NOT NULL,
    region_city          VARCHAR(100),
    company_size_range   VARCHAR(20),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_executive_clients_profile_id    ON executive_clients(executive_profile_id);
CREATE INDEX idx_executive_clients_cnae_region   ON executive_clients(cnae_2digit, region_state);
