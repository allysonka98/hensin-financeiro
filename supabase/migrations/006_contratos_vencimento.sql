-- ============================================================
-- Contratos — vencimento / renovação
-- ============================================================

alter table contratos add column if not exists data_vencimento date;

create index if not exists idx_contratos_vencimento on contratos (data_vencimento);
