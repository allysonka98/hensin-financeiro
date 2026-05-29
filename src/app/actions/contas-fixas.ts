'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ContaFixaCategoria, FormaPagamento } from '@/types'

type FormState = { error?: string } | undefined

export async function criarContaFixa(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  const { error } = await supabase.from('contas_fixas').insert({
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

  if (error) return { error: error.message }

  revalidatePath('/contas-fixas')
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

  revalidatePath('/contas-fixas')
  return undefined
}

export async function excluirContaFixa(id: string): Promise<FormState> {
  const supabase = await createClient()
  const { error } = await supabase.from('contas_fixas').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/contas-fixas')
  return undefined
}
