CREATE TABLE payments (
    id                          UUID           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    engagement_id               UUID           NOT NULL REFERENCES engagements(id),
    stripe_payment_intent_id    VARCHAR(255)   UNIQUE,
    gross_amount                NUMERIC(12,2)  NOT NULL,
    fee_amount                  NUMERIC(12,2)  NOT NULL,
    net_amount                  NUMERIC(12,2)  NOT NULL,
    status                      VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    paid_at                     TIMESTAMPTZ,
    transferred_at              TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_engagement_id               ON payments(engagement_id);
CREATE INDEX idx_payments_status                      ON payments(status);
CREATE INDEX idx_payments_stripe_payment_intent_id    ON payments(stripe_payment_intent_id);
