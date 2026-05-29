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

  const [
    { data: { user } },
    { count: contasVencendo },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('contas_fixas')
      .select('id', { count: 'exact', head: true })
      .eq('ativa', true)
      .gte('dia_vencimento', today)
      .lte('dia_vencimento', today + 5),
  ])

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar contasVencendoBadge={contasVencendo ?? 0} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userEmail={user?.email} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
