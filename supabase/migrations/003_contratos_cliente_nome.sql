-- Allow text-free client entry on contratos
-- The original schema required a FK to clientes; relax it for "cliente texto livre" UX.

ALTER TABLE contratos
  ALTER COLUMN cliente_id DROP NOT NULL;

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
