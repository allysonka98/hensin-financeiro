import { createClient } from '@/lib/supabase/server'
import ContratosClient from './_components/ContratosClient'
import type { Contrato } from '@/types'

export type ContratoComPrestador = Contrato & {
  prestador_responsavel: { id: string; nome: string } | null
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

  return (
    <ContratosClient
      contratos={(contratos ?? []) as ContratoComPrestador[]}
      prestadores={prestadores ?? []}
    />
  )
}
