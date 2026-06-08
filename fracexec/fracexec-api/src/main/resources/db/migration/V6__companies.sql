CREATE TABLE companies (
    id                   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    legal_name           VARCHAR(255) NOT NULL,
    cnpj                 VARCHAR(18)  NOT NULL,
    sector               VARCHAR(100) NOT NULL,
    employee_range       VARCHAR(20)  NOT NULL,
    annual_revenue_range VARCHAR(20)  NOT NULL,
    responsible_name     VARCHAR(255) NOT NULL,
    responsible_email    VARCHAR(255) NOT NULL,
    status               VARCHAR(30)  NOT NULL DEFAULT 'PENDING_ACTIVATION',
    user_id              UUID         REFERENCES users(id),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_companies_cnpj               ON companies(cnpj);
CREATE UNIQUE INDEX idx_companies_responsible_email  ON companies(responsible_email);
CREATE        INDEX idx_companies_status             ON companies(status);
