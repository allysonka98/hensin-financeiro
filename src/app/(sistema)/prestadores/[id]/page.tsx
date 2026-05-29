import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import HistoricoClient from './_components/HistoricoClient'
import type { Lancamento, Prestador } from '@/types'

export default async function PrestadorHistoricoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: prestador }, { data: lancamentos }] = await Promise.all([
    supabase.from('prestadores').select('*').eq('id', id).single(),
    supabase
      .from('lancamentos')
      .select('*')
      .eq('prestador_id', id)
      .order('data_competencia', { ascending: false }),
  ])

  if (!prestador) notFound()

  return (
    <HistoricoClient
      prestador={prestador as Prestador}
      lancamentos={(lancamentos ?? []) as Lancamento[]}
    />
  )
}