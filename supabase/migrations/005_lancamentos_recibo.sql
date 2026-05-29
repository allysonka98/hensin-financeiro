-- Adiciona campos de discriminação de valores e recibo aos lançamentos

ALTER TABLE lancamentos
  ADD COLUMN IF NOT EXISTS valor_fixo       NUMERIC,
  ADD COLUMN IF NOT EXISTS valor_adicional  NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motivo_adicional TEXT,
  ADD COLUMN IF NOT EXISTS tipo_pagamento   TEXT,
  ADD COLUMN IF NOT EXISTS recibo_url       TEXT;
