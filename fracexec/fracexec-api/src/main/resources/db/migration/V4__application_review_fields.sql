-- V4: Add review fields to executive_applications
-- Story 2.3 — Candidacy Review, Decision & Notification

ALTER TABLE executive_applications
    ADD COLUMN admin_notes           TEXT,
    ADD COLUMN support_document_key  VARCHAR(500),
    ADD COLUMN user_id               UUID REFERENCES users(id);
