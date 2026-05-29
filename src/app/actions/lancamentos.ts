'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { LancamentoCategoria, LancamentoTipo, FormaPagamento } from '@/types'

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

export async function criarLancamento(
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

  const { error } = await supabase.from('lancamentos').insert({
    tipo: formData.get('tipo') as LancamentoTipo,
    categoria: formData.get('categoria') as LancamentoCategoria,
    descricao: formData.get('descricao') as string,
    valor: Number(formData.get('valor')),
    data_competencia: formData.get('data_competencia') as string,
    data_pagamento,
    status,
    forma_pagamento: (formData.get('forma_pagamento') as FormaPagamento) || null,
    conta_fixa_id: (formData.get('conta_fixa_id') as string) || null,
    prestador_id: (formData.get('prestador_id') as string) || null,
    observacoes: (formData.get('observacoes') as string) || null,
    comprovante_url,
  })

  if (error) return { error: error.message }

  revalidatePath('/lancamentos')
  return undefined
}

export async function marcarComoPago(
  id: string,
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()

  let comprovante_url: string | null = null
  const file = formData.get('comprovante') as File | null
  if (file && file.size > 0) {
    comprovante_url = await uploadComprovante(supabase, file)
  }

  const data_pagamento =
    (formData.get('data_pagamento') as string) ||
    new Date().toISOString().split('T')[0]

  const update: Record<string, unknown> = { status: 'pago', data_pagamento }
  if (comprovante_url) update.comprovante_url = comprovante_url

  const { error } = await supabase
    .from('lancamentos')
    .update(update)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/lancamentos')
  return undefined
}

export async function excluirLancamento(id: string): Promise<FormState> {
  const supabase = await createClient()
  const { error } = await supabase.from('lancamentos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/lancamentos')
  return undefined
}
