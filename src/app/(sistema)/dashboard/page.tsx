import { createClient } from '@/lib/supabase/server'
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react'
import DashboardCharts from './_components/DashboardCharts'
import { criarLancamentosAutomaticos } from '@/app/actions/lancamentos-automaticos'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const ano = now.getFullYear()
  const mes = now.getMonth()
  const today = now.getDate()

  const startOfMonth = new Date(ano, mes, 1).toISOString().split('T')[0]
  const endOfMonth = new Date(ano, mes + 1, 0).toISOString().split('T')[0]
  const sixMonthsAgo = new Date(ano, mes - 5, 1).toISOString().split('T')[0]

  // Trigger automatic lancamentos and fetch all data in parallel
  const [
    ,
    { data: lancamentosMes },
    { data: historico },
    { data: ultimosLanc },
    { data: contasFixasAtivas },
    { data: prestadoresAtivos },
    { data: lancamentosPrestadores },
  ] = await Promise.all([
    criarLancamentosAutomaticos(),
    supabase
      .from('lancamentos')
      .select('tipo, valor, categoria, status')
      .gte('data_competencia', startOfMonth)
      .lte('data_competencia', endOfMonth),
    supabase
      .from('lancamentos')
      .select('tipo, valor, data_competencia, status')
      .gte('data_competencia', sixMonthsAgo)
      .order('data_competencia', { ascending: true }),
    supabase
      .from('lancamentos')
      .select('id, descricao, valor, tipo, status, data_competencia, categoria')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('contas_fixas')
      .select('id, nome, dia_vencimento')
      .eq('ativa', true),
    supabase
      .from('prestadores')
      .select('id, nome')
      .eq('status', 'ativo'),
    supabase
      .from('lancamentos')
      .select('prestador_id')
      .not('prestador_id', 'is', null)
      .gte('data_competencia', startOfMonth)
      .lte('data_competencia', endOfMonth)
      .neq('status', 'cancelado'),
  ])

  // ── KPIs ────────────────────────────────────────────────────────────────
  const receitas =
    lancamentosMes?.filter(l => l.tipo === 'receita' && l.status === 'pago')
      .reduce((s, l) => s + l.valor, 0) ?? 0
  const despesas =
    lancamentosMes?.filter(l => l.tipo === 'despesa' && l.status === 'pago')
      .reduce((s, l) => s + l.valor, 0) ?? 0
  const saldo = receitas - despesas
  const contasAVencer = contasFixasAtivas?.filter(c => c.dia_vencimento >= today).length ?? 0

  // ── Alertas ─────────────────────────────────────────────────────────────
  const alertasVermelhos =
    contasFixasAtivas?.filter(c => c.dia_vencimento >= today && c.dia_vencimento <= today + 5) ?? []
  const alertasAmarelos =
    contasFixasAtivas?.filter(c => c.dia_vencimento > today + 5 && c.dia_vencimento <= today + 15) ?? []
  const prestadoresPagosIds = new Set(
    lancamentosPrestadores?.map(l => l.prestador_id).filter(Boolean) ?? []
  )
  const prestadoresSemPagamento =
    prestadoresAtivos?.filter(p => !prestadoresPagosIds.has(p.id)) ?? []
  const totalAlertas = alertasVermelhos.length + alertasAmarelos.length + prestadoresSemPagamento.length

  // ── Bar chart data (últimos 6 meses) ────────────────────────────────────
  const mesMap = new Map<string, { receitas: number; despesas: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ano, mes - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    mesMap.set(key, { receitas: 0, despesas: 0 })
  }
  historico?.forEach(l => {
    const key = l.data_competencia?.slice(0, 7)
    if (!key || !mesMap.has(key)) return
    const m = mesMap.get(key)!
    if (l.tipo === 'receita' && l.status === 'pago') m.receitas += l.valor
    else if (l.tipo === 'despesa' && l.status === 'pago') m.despesas += l.valor
  })
  const ultimos6Meses = Array.from(mesMap.entries()).map(([mes, v]) => ({ mes, ...v }))

  // ── Donut chart data (despesas por categoria do mês) ────────────────────
  const catMap = new Map<string, number>()
  lancamentosMes?.forEach(l => {
    if (l.tipo !== 'despesa' || l.status === 'cancelado') return
    catMap.set(l.categoria, (catMap.get(l.categoria) ?? 0) + l.valor)
  })
  const despesasPorCategoria = Array.from(catMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)

  const cards = [
    {
      title: 'Receitas do mês',
      value: formatCurrency(receitas),
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20',
    },
    {
      title: 'Despesas do mês',
      value: formatCurrency(despesas),
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/20',
    },
    {
      title: 'Saldo do mês',
      value: formatCurrency(saldo),
      icon: Wallet,
      color: saldo >= 0 ? 'text-blue-400' : 'text-orange-400',
      bg: saldo >= 0 ? 'bg-blue-400/10' : 'bg-orange-400/10',
      border: saldo >= 0 ? 'border-blue-400/20' : 'border-orange-400/20',
    },
    {
      title: 'Contas a vencer',
      value: String(contasAVencer),
      icon: AlertCircle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <div
            key={card.title}
            className={`rounded-xl border ${card.border} ${card.bg} p-5`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">{card.title}</p>
              <card.icon className={`w-7 h-7 ${card.color}`} />
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Painel de alertas */}
      {totalAlertas > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h2 className="text-white font-semibold text-sm mb-3">Alertas</h2>
          <div className="space-y-2">
            {alertasVermelhos.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="text-red-300">
                  {c.nome} — vence em até 5 dias (dia {c.dia_vencimento})
                </span>
              </div>
            ))}
            {alertasAmarelos.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                <span className="text-yellow-300">
                  {c.nome} — vence em 6 a 15 dias (dia {c.dia_vencimento})
                </span>
              </div>
            ))}
            {prestadoresSemPagamento.map(p => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span className="text-orange-300">
                  {p.nome} — sem pagamento registrado este mês
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráficos + últimos lançamentos */}
      <DashboardCharts
        ultimos6Meses={ultimos6Meses}
        despesasPorCategoria={despesasPorCategoria}
        ultimosLancamentos={ultimosLanc ?? []}
      />
    </div>
  )
}
