import { createClient } from '@/lib/supabase/server'
import RelatoriosClient from './_components/RelatoriosClient'

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const supabase = await createClient()
  const now = new Date()
  const periodoAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { mes: mesParam } = await searchParams
  const periodo = mesParam ?? periodoAtual

  const [anoStr, mesStr] = periodo.split('-')
  const year = Number(anoStr)
  const monthIdx = Number(mesStr) - 1
  const startOfMonth = `${anoStr}-${mesStr}-01`
  const endOfMonth = new Date(year, monthIdx + 1, 0).toISOString().split('T')[0]

  const { data: lancamentos } = await supabase
    .from('lancamentos')
    .select('*, prestador:prestadores(id, nome)')
    .gte('data_competencia', startOfMonth)
    .lte('data_competencia', endOfMonth)
    .order('data_competencia', { ascending: false })

  const mesNome = new Date(year, monthIdx, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <RelatoriosClient
      lancamentos={lancamentos ?? []}
      mesAno={mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}
      periodo={periodo}
    />
  )
}