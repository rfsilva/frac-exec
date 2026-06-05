-- V12: Adicionar campo can_reapply_after e rejection_reason à tabela executive_applications
-- Necessário para o cooldown de 6 meses (FR-1.7) funcionar no PostgreSQL
ALTER TABLE executive_applications
    ADD COLUMN IF NOT EXISTS rejection_reason  TEXT,
    ADD COLUMN IF NOT EXISTS can_reapply_after TIMESTAMPTZ;
