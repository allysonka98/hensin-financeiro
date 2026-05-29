import { createClient } from '@/lib/supabase/server'
import LancamentosClient from './_components/LancamentosClient'

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { mes } = await searchParams

  const now = new Date()
  const periodo =
    mes ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [year, month] = periodo.split('-')
  const startOfMonth = `${year}-${month}-01`
  const endOfMonth = new Date(Number(year), Number(month), 0)
    .toISOString()
    .split('T')[0]

  const supabase = await createClient()

  const [{ data: lancamentos }, { data: contasFixas }, { data: prestadores }] =
    await Promise.all([
      supabase
        .from('lancamentos')
        .select('*')
        .gte('data_competencia', startOfMonth)
        .lte('data_competencia', endOfMonth)
        .order('data_competencia', { ascending: false }),
      supabase
        .from('contas_fixas')
        .select('id, nome')
        .eq('ativa', true)
        .order('nome'),
      supabase
        .from('prestadores')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome'),
    ])

  return (
    <LancamentosClient
      lancamentos={lancamentos ?? []}
      contasFixas={contasFixas ?? []}
      prestadores={prestadores ?? []}
      periodo={periodo}
    />
  )
}
