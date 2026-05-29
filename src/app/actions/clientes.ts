'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ClienteStatus } from '@/types'

type FormState = { error?: string } | undefined

export async function criarCliente(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  const { error } = await supabase.from('clientes').insert({
    nome: formData.get('nome') as string,
    cpf: formData.get('cpf') as string,
    rg: (formData.get('rg') as string) || null,
    data_nascimento: (formData.get('data_nascimento') as string) || null,
    telefone: (formData.get('telefone') as string) || null,
    email: (formData.get('email') as string) || null,
    endereco: (formData.get('endereco') as string) || null,
    status: ((formData.get('status') as ClienteStatus) || 'ativo') as ClienteStatus,
    observacoes: (formData.get('observacoes') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/clientes')
  return undefined
}

export async function atualizarCliente(
  id: string,
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clientes')
    .update({
      nome: formData.get('nome') as string,
      cpf: formData.get('cpf') as string,
      rg: (formData.get('rg') as string) || null,
      data_nascimento: (formData.get('data_nascimento') as string) || null,
      telefone: (formData.get('telefone') as string) || null,
      email: (formData.get('email') as string) || null,
      endereco: (formData.get('endereco') as string) || null,
      status: formData.get('status') as ClienteStatus,
      observacoes: (formData.get('observacoes') as string) || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return undefined
}

export async function excluirCliente(id: string): Promise<FormState> {
  const supabase = await createClient()
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return undefined
}
