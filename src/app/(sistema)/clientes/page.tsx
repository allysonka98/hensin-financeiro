import { createClient } from '@/lib/supabase/server'
import ClientesClient from './_components/ClientesClient'
import type { Cliente } from '@/types'

export default async function ClientesPage() {
  const supabase = await createClient()

  const [{ data: clientes }, { data: contratos }] = await Promise.all([
    supabase.from('clientes').select('*').order('nome'),
    supabase.from('contratos').select('cliente_id').not('cliente_id', 'is', null),
  ])

  const countMap = new Map<string, number>()
  contratos?.forEach(c => {
    if (c.cliente_id) countMap.set(c.cliente_id, (countMap.get(c.cliente_id) ?? 0) + 1)
  })

  const clientesComCount = (clientes ?? []).map(c => ({
    ...(c as Cliente),
    contratos_count: countMap.get(c.id) ?? 0,
  }))

  return <ClientesClient clientes={clientesComCount} />
}
