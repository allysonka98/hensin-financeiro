-- ============================================================
-- Hensin Financeiro — Schema inicial
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- CLIENTES
-- ============================================================
create table if not exists clientes (
  id              uuid primary key default uuid_generate_v4(),
  nome            text not null,
  cpf             text not null unique,
  telefone        text,
  email           text,
  status          text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at      timestamptz not null default now()
);

alter table clientes enable row level security;

create policy "Autenticados podem ler clientes"
  on clientes for select
  to authenticated
  using (true);

create policy "Autenticados podem inserir clientes"
  on clientes for insert
  to authenticated
  with check (true);

create policy "Autenticados podem atualizar clientes"
  on clientes for update
  to authenticated
  using (true);

create policy "Autenticados podem deletar clientes"
  on clientes for delete
  to authenticated
  using (true);

-- ============================================================
-- PRESTADORES (todos PJ)
-- ============================================================
create table if not exists prestadores (
  id              uuid primary key default uuid_generate_v4(),
  nome            text not null,
  cpf_cnpj        text not null unique,
  tipo            text not null default 'PJ' check (tipo = 'PJ'),
  email           text,
  telefone        text,
  pix             text,
  banco           text,
  agencia         text,
  conta           text,
  funcao          text not null,
  valor_combinado numeric(12, 2),
  status          text not null default 'ativo' check (status in ('ativo', 'inativo', 'suspenso')),
  observacoes     text,
  created_at      timestamptz not null default now()
);

alter table prestadores enable row level security;

create policy "Autenticados podem ler prestadores"
  on prestadores for select
  to authenticated
  using (true);

create policy "Autenticados podem inserir prestadores"
  on prestadores for insert
  to authenticated
  with check (true);

create policy "Autenticados podem atualizar prestadores"
  on prestadores for update
  to authenticated
  using (true);

create policy "Autenticados podem deletar prestadores"
  on prestadores for delete
  to authenticated
  using (true);

-- ============================================================
-- CONTRATOS
-- ============================================================
create table if not exists contratos (
  id                        uuid primary key default uuid_generate_v4(),
  cliente_id                uuid not null references clientes (id) on delete restrict,
  descricao                 text not null,
  tipo_acao                 text not null,
  valor                     numeric(14, 2) not null,
  honorarios                numeric(14, 2) not null,
  data_assinatura           date not null,
  status                    text not null default 'ativo'
                              check (status in ('ativo', 'encerrado', 'suspenso', 'em_negociacao')),
  prestador_responsavel_id  uuid references prestadores (id) on delete set null,
  created_at                timestamptz not null default now()
);

alter table contratos enable row level security;

create policy "Autenticados podem ler contratos"
  on contratos for select
  to authenticated
  using (true);

create policy "Autenticados podem inserir contratos"
  on contratos for insert
  to authenticated
  with check (true);

create policy "Autenticados podem atualizar contratos"
  on contratos for update
  to authenticated
  using (true);

create policy "Autenticados podem deletar contratos"
  on contratos for delete
  to authenticated
  using (true);

-- ============================================================
-- CONTAS FIXAS
-- ============================================================
create table if not exists contas_fixas (
  id              uuid primary key default uuid_generate_v4(),
  nome            text not null,
  categoria       text not null
                    check (categoria in (
                      'aluguel','internet','telefonia','energia',
                      'agua','software','contabilidade','outros'
                    )),
  valor_estimado  numeric(12, 2) not null,
  dia_vencimento  int not null check (dia_vencimento between 1 and 31),
  fornecedor      text,
  forma_pagamento text not null
                    check (forma_pagamento in (
                      'pix','transferencia','boleto',
                      'cartao_credito','cartao_debito','dinheiro'
                    )),
  recorrente      boolean not null default true,
  ativa           boolean not null default true,
  observacoes     text,
  created_at      timestamptz not null default now()
);

alter table contas_fixas enable row level security;

create policy "Autenticados podem ler contas_fixas"
  on contas_fixas for select
  to authenticated
  using (true);

create policy "Autenticados podem inserir contas_fixas"
  on contas_fixas for insert
  to authenticated
  with check (true);

create policy "Autenticados podem atualizar contas_fixas"
  on contas_fixas for update
  to authenticated
  using (true);

create policy "Autenticados podem deletar contas_fixas"
  on contas_fixas for delete
  to authenticated
  using (true);

-- ============================================================
-- LANÇAMENTOS
-- ============================================================
create table if not exists lancamentos (
  id               uuid primary key default uuid_generate_v4(),
  tipo             text not null check (tipo in ('receita', 'despesa')),
  categoria        text not null
                     check (categoria in (
                       'honorarios','prestador','conta_fixa',
                       'imposto','escritorio','marketing','outros'
                     )),
  descricao        text not null,
  valor            numeric(14, 2) not null,
  data_competencia date not null,
  data_pagamento   date,
  status           text not null default 'pendente'
                     check (status in ('pendente', 'pago', 'cancelado')),
  conta_fixa_id    uuid references contas_fixas (id) on delete set null,
  prestador_id     uuid references prestadores (id) on delete set null,
  comprovante_url  text,
  forma_pagamento  text
                     check (forma_pagamento in (
                       'pix','transferencia','boleto',
                       'cartao_credito','cartao_debito','dinheiro'
                     )),
  observacoes      text,
  created_at       timestamptz not null default now()
);

alter table lancamentos enable row level security;

create policy "Autenticados podem ler lancamentos"
  on lancamentos for select
  to authenticated
  using (true);

create policy "Autenticados podem inserir lancamentos"
  on lancamentos for insert
  to authenticated
  with check (true);

create policy "Autenticados podem atualizar lancamentos"
  on lancamentos for update
  to authenticated
  using (true);

create policy "Autenticados podem deletar lancamentos"
  on lancamentos for delete
  to authenticated
  using (true);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_lancamentos_data_competencia on lancamentos (data_competencia);
create index if not exists idx_lancamentos_status           on lancamentos (status);
create index if not exists idx_lancamentos_prestador        on lancamentos (prestador_id);
create index if not exists idx_lancamentos_conta_fixa       on lancamentos (conta_fixa_id);
create index if not exists idx_contratos_cliente            on contratos (cliente_id);
create index if not exists idx_contratos_prestador          on contratos (prestador_responsavel_id);
create index if not exists idx_contratos_status             on contratos (status);
