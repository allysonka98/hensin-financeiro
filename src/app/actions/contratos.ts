'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ContratoStatus } from '@/types'

type FormState = { error?: string } | undefined

export async function criarContrato(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  const { error } = await supabase.from('contratos').insert({
    cliente_nome: formData.get('cliente_nome') as string,
    cliente_id: null,
    descricao: formData.get('descricao') as string,
    tipo_acao: formData.get('tipo_acao') as string,
    valor: Number(formData.get('valor')),
    honorarios: Number(formData.get('honorarios')),
    data_assinatura: formData.get('data_assinatura') as string,
    status: (formData.get('status') as ContratoStatus) || 'ativo',
    prestador_responsavel_id:
      (formData.get('prestador_responsavel_id') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/contratos')
  return undefined
}

export async function atualizarContrato(
  id: string,
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('contratos')
    .update({
      cliente_nome: formData.get('cliente_nome') as string,
      descricao: formData.get('descricao') as string,
      tipo_acao: formData.get('tipo_acao') as string,
      valor: Number(formData.get('valor')),
      honorarios: Number(formData.get('honorarios')),
      data_assinatura: formData.get('data_assinatura') as string,
      status: formData.get('status') as ContratoStatus,
      prestador_responsavel_id:
        (formData.get('prestador_responsavel_id') as string) || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/contratos')
  return undefined
}

export async function excluirContrato(id: string): Promise<FormState> {
  const supabase = await createClient()
  const { error } = await supabase.from('contratos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/contratos')
  return undefined
}
