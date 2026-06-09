import { createClient } from '@/lib/supabase/server'
import HoleriteClient from './_components/HoleriteClient'
import type { Prestador, Bonificacao, Configuracao, Lancamento } from '@/types'

export default async function HoleritePage() {
  const supabase = await createClient()

  const [
    { data: prestadores },
    { data: bonificacoes },
    { data: configuracoes },
    { data: lancamentos },
  ] = await Promise.all([
    supabase.from('prestadores').select('*').eq('status', 'ativo').order('nome'),
    supabase.from('bonificacoes').select('*'),
    supabase.from('configuracoes').select('*').limit(1),
    supabase
      .from('lancamentos')
      .select('*')
      .eq('categoria', 'prestador')
      .not('prestador_id', 'is', null),
  ])

  return (
    <HoleriteClient
      prestadores={(prestadores ?? []) as Prestador[]}
      bonificacoes={(bonificacoes ?? []) as Bonificacao[]}
      configuracao={(configuracoes?.[0] ?? null) as Configuracao | null}
      lancamentos={(lancamentos ?? []) as Lancamento[]}
    />
  )
}
