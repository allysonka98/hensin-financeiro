import { createClient } from '@/lib/supabase/server'
import type { ContaFixa } from '@/types'
import ContasFixasClient from './_components/ContasFixasClient'

export type ContaFixaComStatus = ContaFixa & {
  status_mes: 'paga' | 'pendente' | 'vencida' | 'inativa'
}

export default async function ContasFixasPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]
  const today = now.getDate()

  const [{ data: contas }, { data: lancamentosMes }] = await Promise.all([
    supabase.from('contas_fixas').select('*').order('dia_vencimento'),
    supabase
      .from('lancamentos')
      .select('conta_fixa_id, status')
      .not('conta_fixa_id', 'is', null)
      .gte('data_competencia', startOfMonth)
      .lte('data_competencia', endOfMonth),
  ])

  const pagaIds = new Set(
    (lancamentosMes ?? [])
      .filter((l) => l.status === 'pago')
      .map((l) => l.conta_fixa_id as string)
  )

  const contasComStatus: ContaFixaComStatus[] = (contas ?? []).map((conta) => {
    if (!conta.ativa) return { ...conta, status_mes: 'inativa' as const }
    if (pagaIds.has(conta.id)) return { ...conta, status_mes: 'paga' as const }
    if (conta.dia_vencimento < today) return { ...conta, status_mes: 'vencida' as const }
    return { ...conta, status_mes: 'pendente' as const }
  })

  return <ContasFixasClient contas={contasComStatus} />
}
