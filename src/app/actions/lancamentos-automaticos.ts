'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function criarLancamentosAutomaticos(): Promise<void> {
  const supabase = await createClient()

  const now = new Date()
  const ano = now.getFullYear()
  const mes = now.getMonth() + 1
  const startOfMonth = `${ano}-${String(mes).padStart(2, '0')}-01`
  const daysInMonth = new Date(ano, mes, 0).getDate()
  const endOfMonth = `${ano}-${String(mes).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

  const { data: contasFixas } = await supabase
    .from('contas_fixas')
    .select('id, nome, categoria, valor_estimado, dia_vencimento, forma_pagamento')
    .eq('ativa', true)

  if (!contasFixas?.length) return

  const { data: lancamentosExistentes } = await supabase
    .from('lancamentos')
    .select('conta_fixa_id')
    .not('conta_fixa_id', 'is', null)
    .gte('data_competencia', startOfMonth)
    .lte('data_competencia', endOfMonth)

  const idsComLancamento = new Set(
    lancamentosExistentes?.map((l) => l.conta_fixa_id).filter(Boolean) ?? []
  )

  const novos = contasFixas
    .filter((c) => !idsComLancamento.has(c.id))
    .map((c) => {
      const dia = Math.min(c.dia_vencimento, daysInMonth)
      return {
        tipo: 'despesa' as const,
        categoria: 'conta_fixa' as const,
        descricao: c.nome,
        valor: c.valor_estimado,
        data_competencia: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
        status: 'pendente' as const,
        forma_pagamento: c.forma_pagamento,
        conta_fixa_id: c.id,
      }
    })

  if (!novos.length) return

  await supabase.from('lancamentos').insert(novos)

  revalidatePath('/dashboard')
  revalidatePath('/lancamentos')
}
