-- V1: Baseline schema
-- Epic 1 — Foundation & Infrastructure
-- This is the initial Flyway baseline. Future migrations add tables.
-- V2: users + refresh_tokens (Story 1.2)
-- V3: executive_applications + executive_profiles (Stories 2.1 + 2.4)
-- V4: companies + needs (Stories 3.1 + 3.2)
-- V5: executive_clients + shortlists + mediation_messages (Stories 4.1 + 4.2 + 4.6)
-- V6: contracts + engagements + payments (Stories 5.1 + 5.2)
-- V7-V9: RESERVED — do not create

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
