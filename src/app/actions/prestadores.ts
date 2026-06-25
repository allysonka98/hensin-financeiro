'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PrestadorTipo, PrestadorStatus, FormaPagamento } from '@/types'

type FormState = { error?: string } | undefined

async function uploadComprovante(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File
): Promise<string | null> {
  const now = new Date()
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('comprovantes')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return null

  const {
    data: { publicUrl },
  } = supabase.storage.from('comprovantes').getPublicUrl(path)

  return publicUrl
}

export async function criarPrestador(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  const { error } = await supabase.from('prestadores').insert({
    nome: formData.get('nome') as string,
    cpf_cnpj: formData.get('cpf_cnpj') as string,
    tipo: formData.get('tipo') as PrestadorTipo,
    funcao: formData.get('funcao') as string,
    email: (formData.get('email') as string) || null,
    telefone: (formData.get('telefone') as string) || null,
    pix: (formData.get('pix') as string) || null,
    banco: (formData.get('banco') as string) || null,
    agencia: (formData.get('agencia') as string) || null,
    conta: (formData.get('conta') as string) || null,
    valor_combinado: formData.get('valor_combinado')
      ? Number(formData.get('valor_combinado'))
      : null,
    status: (formData.get('status') as PrestadorStatus) || 'ativo',
    observacoes: (formData.get('observacoes') as string) || null,
    data_nascimento: (formData.get('data_nascimento') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/prestadores')
  return undefined
}

export async function atualizarPrestador(
  id: string,
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('prestadores')
    .update({
      nome: formData.get('nome') as string,
      cpf_cnpj: formData.get('cpf_cnpj') as string,
      tipo: formData.get('tipo') as PrestadorTipo,
      funcao: formData.get('funcao') as string,
      email: (formData.get('email') as string) || null,
      telefone: (formData.get('telefone') as string) || null,
      pix: (formData.get('pix') as string) || null,
      banco: (formData.get('banco') as string) || null,
      agencia: (formData.get('agencia') as string) || null,
      conta: (formData.get('conta') as string) || null,
      valor_combinado: formData.get('valor_combinado')
        ? Number(formData.get('valor_combinado'))
        : null,
      status: formData.get('status') as PrestadorStatus,
      observacoes: (formData.get('observacoes') as string) || null,
      data_nascimento: (formData.get('data_nascimento') as string) || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/prestadores')
  return undefined
}

export async function excluirPrestador(id: string): Promise<FormState> {
  const supabase = await createClient()
  const { error } = await supabase.from('prestadores').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/prestadores')
  return undefined
}

export async function salvarRecibo(
  export async function editarLancamentoPrestador(
  lancamentoId: string,
  _state: any,
  formData: FormData
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('lancamentos')
    .update({
      descricao: formData.get('descricao') as string,
      valor: Number(formData.get('valor')),
      data_competencia: formData.get('data_competencia') as string,
      data_pagamento: (formData.get('data_pagamento') as string) || null,
      forma_pagamento: (formData.get('forma_pagamento') as string) || null,
      observacoes: (formData.get('observacoes') as string) || null,
      tipo_pagamento: (formData.get('tipo_pagamento') as string) || null,
    })
    .eq('id', lancamentoId)

  if (error) return { error: error.message }

  revalidatePath('/prestadores')

  return undefined
}
  lancamentoId: string,
  base64: string
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient()

  const buffer = Buffer.from(base64, 'base64')

  const path = `recibos/${lancamentoId}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('comprovantes')
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    return { error: uploadError.message }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('comprovantes').getPublicUrl(path)

  await supabase
    .from('lancamentos')
    .update({
      recibo_url: publicUrl,
    })
    .eq('id', lancamentoId)

  revalidatePath('/prestadores')

  return {
    url: publicUrl,
  }
}