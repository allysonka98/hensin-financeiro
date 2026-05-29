-- ============================================================
-- CONFIGURAÇÕES DO ESCRITÓRIO (linha única)
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  nome_escritorio  TEXT NOT NULL DEFAULT '',
  cnpj             TEXT NOT NULL DEFAULT '',
  endereco         TEXT NOT NULL DEFAULT '',
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO configuracoes (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler configuracoes"
  ON configuracoes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem atualizar configuracoes"
  ON configuracoes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Autenticados podem inserir configuracoes"
  ON configuracoes FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- CATEGORIAS DE DESPESA PERSONALIZADAS
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias_despesa (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categorias_despesa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler categorias_despesa"
  ON categorias_despesa FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem inserir categorias_despesa"
  ON categorias_despesa FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados podem deletar categorias_despesa"
  ON categorias_despesa FOR DELETE TO authenticated USING (true);
