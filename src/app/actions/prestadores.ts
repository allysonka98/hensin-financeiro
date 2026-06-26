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

export async function lancarPagamentoPrestador(
  prestadorId: string,
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  let comprovante_url: string | null = null
  const file = formData.get('comprovante') as File | null
  if (file && file.size > 0) {
    comprovante_url = await uploadComprovante(supabase, file)
  }

  const data_pagamento = (formData.get('data_pagamento') as string) || null
  const status = data_pagamento ? 'pago' : 'pendente'

  const valorFixoRaw = formData.get('valor_fixo')
  const valorAdicionalRaw = formData.get('valor_adicional')

  const { error } = await supabase.from('lancamentos').insert({
    tipo: 'despesa',
    categoria: 'prestador',
    descricao: formData.get('descricao') as string,
    valor: Number(formData.get('valor')),
    data_competencia: formData.get('data_competencia') as string,
    data_pagamento,
    status,
    forma_pagamento: (formData.get('forma_pagamento') as FormaPagamento) || null,
    prestador_id: prestadorId,
    observacoes: (formData.get('observacoes') as string) || null,
    comprovante_url,
    valor_fixo: valorFixoRaw ? Number(valorFixoRaw) : null,
    valor_adicional: valorAdicionalRaw ? Number(valorAdicionalRaw) : 0,
    motivo_adicional: (formData.get('motivo_adicional') as string) || null,
    tipo_pagamento: (formData.get('tipo_pagamento') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/prestadores', 'layout')
  revalidatePath('/lancamentos')
  return undefined
}

export async function editarLancamentoPrestador(
  lancamentoId: string,
  data: {
    descricao: string
    valor: number
    data_competencia: string
    data_pagamento: string | null
    forma_pagamento: string | null
    observacoes: string | null
    tipo_pagamento: string | null
    valor_fixo: number | null
    valor_adicional: number | null
    motivo_adicional: string | null
    status: string
  }
): Promise<FormState> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('lancamentos')
    .update({
      descricao: data.descricao,
      valor: data.valor,
      data_competencia: data.data_competencia,
      data_pagamento: data.data_pagamento || null,
      forma_pagamento: data.forma_pagamento || null,
      observacoes: data.observacoes || null,
      tipo_pagamento: data.tipo_pagamento || null,
      valor_fixo: data.valor_fixo,
      valor_adicional: data.valor_adicional,
      motivo_adicional: data.motivo_adicional || null,
      status: data.data_pagamento ? 'pago' : 'pendente',
    })
    .eq('id', lancamentoId)

  if (error) return { error: error.message }

  revalidatePath('/prestadores', 'layout')
  return undefined
}

export async function salvarBonificacao(
  prestadorId: string,
  mes: number,
  ano: number,
  valor: number,
  descricao: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('bonificacoes').upsert(
    { prestador_id: prestadorId, mes, ano, valor, descricao },
    { onConflict: 'prestador_id,mes,ano' }
  )
  if (error) return { error: error.message }
  revalidatePath('/prestadores')
  return {}
}

export async function excluirBonificacao(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('bonificacoes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prestadores')
  return {}
}

export async function salvarRecibo(
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

  if (uploadError) return { error: uploadError.message }

  const {
    data: { publicUrl },
  } = supabase.storage.from('comprovantes').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('lancamentos')
    .update({ recibo_url: publicUrl })
    .eq('id', lancamentoId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/prestadores', 'layout')
  return { url: publicUrl }
}
