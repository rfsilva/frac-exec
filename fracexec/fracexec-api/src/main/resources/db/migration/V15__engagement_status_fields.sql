-- V15: Campos de auditoria de status em engagements (Story 6.2)
ALTER TABLE engagements
    ADD COLUMN IF NOT EXISTS status_reason    TEXT,
    ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;
