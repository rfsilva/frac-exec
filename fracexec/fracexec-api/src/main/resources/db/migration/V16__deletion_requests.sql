-- V16: Solicitações de exclusão de dados LGPD (Story 6.3)
CREATE TABLE deletion_requests (
    id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID        NOT NULL REFERENCES users(id),
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    process_after   TIMESTAMPTZ NOT NULL,
    processed_at    TIMESTAMPTZ
);

CREATE INDEX idx_deletion_requests_user_id      ON deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_status       ON deletion_requests(status);
CREATE INDEX idx_deletion_requests_process_after ON deletion_requests(process_after);
