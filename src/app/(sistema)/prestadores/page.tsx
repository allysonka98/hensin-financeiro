import { createClient } from '@/lib/supabase/server'
import PrestadoresClient from './_components/PrestadoresClient'
import type { Prestador } from '@/types'

export type PrestadorComStatus = Prestador & {
  status_mes: 'pago' | 'pendente'
}

export default async function PrestadoresPage() {
  const supabase = await createClient()

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const startOfMonth = `${year}-${month}-01`
  const endOfMonth = new Date(year, now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  const [{ data: prestadores }, { data: lancamentos }] = await Promise.all([
    supabase.from('prestadores').select('*').order('nome'),
    supabase
      .from('lancamentos')
      .select('prestador_id, status')
      .not('prestador_id', 'is', null)
      .gte('data_competencia', startOfMonth)
      .lte('data_competencia', endOfMonth),
  ])

  const pagosMes = new Set(
    (lancamentos ?? [])
      .filter((l) => l.status === 'pago')
      .map((l) => l.prestador_id as string)
  )

  const prestadoresComStatus: PrestadorComStatus[] = (prestadores ?? []).map(
    (p) => ({
      ...p,
      status_mes: pagosMes.has(p.id) ? 'pago' : 'pendente',
    })
  )

  return <PrestadoresClient prestadores={prestadoresComStatus} />
}
