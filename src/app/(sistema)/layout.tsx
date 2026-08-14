import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default async function SistemaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const now = new Date()
  const today = now.getDate()
  const em30Dias = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0]

  const [
    { data: { user } },
    { count: contasVencendo },
    { count: contratosVencendo },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('contas_fixas')
      .select('id', { count: 'exact', head: true })
      .eq('ativa', true)
      .gte('dia_vencimento', today)
      .lte('dia_vencimento', today + 5),
    supabase
      .from('contratos')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ativo')
      .not('data_vencimento', 'is', null)
      .lte('data_vencimento', em30Dias),
  ])

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar
        contasVencendoBadge={contasVencendo ?? 0}
        contratosVencendoBadge={contratosVencendo ?? 0}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userEmail={user?.email} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
