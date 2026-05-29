-- Normalize prestadores.tipo to use 'pessoa_fisica' / 'pessoa_juridica'

ALTER TABLE prestadores
  DROP CONSTRAINT IF EXISTS prestadores_tipo_check;

ALTER TABLE prestadores
  ADD CONSTRAINT prestadores_tipo_check
    CHECK (tipo IN ('pessoa_fisica', 'pessoa_juridica'));

ALTER TABLE prestadores
  ALTER COLUMN tipo SET DEFAULT 'pessoa_juridica';
