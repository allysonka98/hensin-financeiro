import { createClient } from '@/lib/supabase/server'
import RelatoriosClient from './_components/RelatoriosClient'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const startOfMonth = `${year}-${month}-01`
  const endOfMonth = new Date(year, now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  const { data: lancamentos } = await supabase
    .from('lancamentos')
    .select('*')
    .gte('data_competencia', startOfMonth)
    .lte('data_competencia', endOfMonth)
    .order('data_competencia', { ascending: false })

  const mesNome = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <RelatoriosClient
      lancamentos={lancamentos ?? []}
      mesAno={mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}
    />
  )
}