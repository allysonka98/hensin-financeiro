import { createClient } from '@/lib/supabase/server'
import ContratosClient from './_components/ContratosClient'
import type { Contrato } from '@/types'

export type ContratoComPrestador = Contrato & {
  prestador_responsavel: { id: string; nome: string } | null
}

export type VencimentoStatus = 'vencido' | 'vence_em_breve' | 'ok' | null

export type ContratoComStatus = ContratoComPrestador & {
  vencimento_status: VencimentoStatus
}

export default async function ContratosPage() {
  const supabase = await createClient()

  const [{ data: contratos }, { data: prestadores }] = await Promise.all([
    supabase
      .from('contratos')
      .select('*, prestador_responsavel:prestadores(id, nome)')
      .order('created_at', { ascending: false }),
    supabase
      .from('prestadores')
      .select('id, nome')
      .eq('status', 'ativo')
      .order('nome'),
  ])

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const em30Dias = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0]

  const contratosComStatus: ContratoComStatus[] = (
    (contratos ?? []) as ContratoComPrestador[]
  ).map(c => {
    let vencimento_status: VencimentoStatus = null
    if (c.data_vencimento && c.status === 'ativo') {
      if (c.data_vencimento < todayStr) vencimento_status = 'vencido'
      else if (c.data_vencimento <= em30Dias) vencimento_status = 'vence_em_breve'
      else vencimento_status = 'ok'
    }
    return { ...c, vencimento_status }
  })

  return (
    <ContratosClient
      contratos={contratosComStatus}
      prestadores={prestadores ?? []}
    />
  )
}
