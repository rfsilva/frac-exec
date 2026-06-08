-- Fix: cnae_2digit e region_state eram CHAR(2) — alterar para VARCHAR(2) para compatibilidade com Hibernate
ALTER TABLE executive_clients ALTER COLUMN cnae_2digit    TYPE VARCHAR(2);
ALTER TABLE executive_clients ALTER COLUMN region_state   TYPE VARCHAR(2);
