-- ============================================================
-- Documentação da política de RLS (sem mudança de comportamento)
-- ============================================================
-- Todas as tabelas usam a mesma política: qualquer usuário autenticado
-- tem select/insert/update/delete completos (`using (true)` / `with check (true)`).
--
-- Isso é intencional para o modelo atual do sistema: um único login
-- compartilhado pelo escritório, sem diferenciação de papéis (admin,
-- leitura, etc.) na camada de aplicação. Dar login a alguém já
-- equivale hoje a dar acesso total a todos os dados financeiros.
--
-- Antes de conceder uma conta a alguém que não deva ter acesso total
-- (ex.: estagiário só-leitura, contador externo), é necessário:
--   1. Criar uma tabela de perfis/roles vinculada a auth.users;
--   2. Reescrever as policies para checar o papel do usuário
--      (ex.: `using (auth.jwt() ->> 'role' = 'admin')`);
--   3. Só então criar o login da nova pessoa.
-- Até lá, este modelo permissivo é seguro apenas porque o número de
-- contas é pequeno e todas pertencem a pessoas de confiança do escritório.

comment on table prestadores is
  'RLS: acesso total para qualquer usuário autenticado (login único do escritório, sem papéis). Ver 007_rls_documentation.sql.';
comment on table contratos is
  'RLS: acesso total para qualquer usuário autenticado (login único do escritório, sem papéis). Ver 007_rls_documentation.sql.';
comment on table contas_fixas is
  'RLS: acesso total para qualquer usuário autenticado (login único do escritório, sem papéis). Ver 007_rls_documentation.sql.';
comment on table lancamentos is
  'RLS: acesso total para qualquer usuário autenticado (login único do escritório, sem papéis). Ver 007_rls_documentation.sql.';
comment on table clientes is
  'RLS: acesso total para qualquer usuário autenticado (login único do escritório, sem papéis). Ver 007_rls_documentation.sql.';
