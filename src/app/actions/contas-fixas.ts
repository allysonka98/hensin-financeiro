'use server'

import { refresh } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ContaFixaCategoria, FormaPagamento } from '@/types'

type FormState = { error?: string } | undefined

export async function criarContaFixa(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  const { data: contaFixa, error } = await supabase
    .from('contas_fixas')
    .insert({
      nome: formData.get('nome') as string,
      categoria: formData.get('categoria') as ContaFixaCategoria,
      valor_estimado: Number(formData.get('valor_estimado')),
      dia_vencimento: Number(formData.get('dia_vencimento')),
      fornecedor: (formData.get('fornecedor') as string) || null,
      forma_pagamento: formData.get('forma_pagamento') as FormaPagamento,
      recorrente: formData.get('recorrente') === 'on',
      ativa: formData.get('ativa') === 'on',
      observacoes: (formData.get('observacoes') as string) || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  const now = new Date()
  const anoVenc = Number(formData.get('ano_vencimento')) || now.getFullYear()
  const mesVenc = Number(formData.get('mes_vencimento')) || (now.getMonth() + 1)
  const daysInMonth = new Date(anoVenc, mesVenc, 0).getDate()
  const dia = Math.min(contaFixa.dia_vencimento, daysInMonth)

  await supabase.from('lancamentos').insert({
    tipo: 'despesa' as const,
    categoria: 'conta_fixa' as const,
    descricao: contaFixa.nome,
    valor: contaFixa.valor_estimado,
    data_competencia: `${anoVenc}-${String(mesVenc).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
    status: 'pendente' as const,
    forma_pagamento: contaFixa.forma_pagamento,
    conta_fixa_id: contaFixa.id,
  })

  refresh()
  return undefined
}

export async function atualizarContaFixa(
  id: string,
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('contas_fixas')
    .update({
      nome: formData.get('nome') as string,
      categoria: formData.get('categoria') as ContaFixaCategoria,
      valor_estimado: Number(formData.get('valor_estimado')),
      dia_vencimento: Number(formData.get('dia_vencimento')),
      fornecedor: (formData.get('fornecedor') as string) || null,
      forma_pagamento: formData.get('forma_pagamento') as FormaPagamento,
      recorrente: formData.get('recorrente') === 'on',
      ativa: formData.get('ativa') === 'on',
      observacoes: (formData.get('observacoes') as string) || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  refresh()
  return undefined
}

export async function excluirContaFixa(id: string): Promise<FormState> {
  const supabase = await createClient()
  const { error } = await supabase.from('contas_fixas').delete().eq('id', id)
  if (error) return { error: error.message }
  refresh()
  return undefined
}
