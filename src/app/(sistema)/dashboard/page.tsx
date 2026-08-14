import { createClient } from '@/lib/supabase/server'
import { after } from 'next/server'
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Users } from 'lucide-react'
import DashboardCharts from './_components/DashboardCharts'
import MesNav from '@/components/MesNav'
import { criarLancamentosAutomaticos } from '@/app/actions/lancamentos-automaticos'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatVariacao(atual: number, anterior: number | null): string | null {
  if (anterior == null || anterior === 0) return null
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100
  const sinal = pct > 0 ? '▲' : pct < 0 ? '▼' : '—'
  return `${sinal} ${Math.abs(pct).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs mês anterior`
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const supabase = await createClient()

  // Roda em background após a resposta ser enviada, sem bloquear o carregamento do dashboard.
  after(() => {
    criarLancamentosAutomaticos()
  })

  const now = new Date()
  const today = now.getDate()
  const periodoAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { mes: mesParam } = await searchParams
  const periodo = mesParam ?? periodoAtual
  const isMesAtual = periodo === periodoAtual

  const [anoStr, mesStr] = periodo.split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr) - 1
  const mesNome = new Date(ano, mes, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const startOfMonth = new Date(ano, mes, 1).toISOString().split('T')[0]
  const endOfMonth = new Date(ano, mes + 1, 0).toISOString().split('T')[0]
  const sixMonthsAgo = new Date(ano, mes - 5, 1).toISOString().split('T')[0]

  const [
    { data: lancamentosMes },
    { data: historico },
    { data: ultimosLanc },
    { data: contasFixasAtivas },
    { data: prestadoresAtivos },
    { data: lancamentosPrestadores },
  ] = await Promise.all([
    supabase
      .from('lancamentos')
      .select('tipo, valor, categoria, status')
      .gte('data_competencia', startOfMonth)
      .lte('data_competencia', endOfMonth),
    supabase
      .from('lancamentos')
      .select('tipo, valor, data_competencia, status')
      .gte('data_competencia', sixMonthsAgo)
      .lte('data_competencia', endOfMonth)
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

  // ── Comparativo vs. mês anterior ─────────────────────────────────────────
  const mesAnterior = ultimos6Meses.length >= 2 ? ultimos6Meses[ultimos6Meses.length - 2] : null
  const saldoAnterior = mesAnterior ? mesAnterior.receitas - mesAnterior.despesas : null
  const varReceitas = formatVariacao(receitas, mesAnterior?.receitas ?? null)
  const varDespesas = formatVariacao(despesas, mesAnterior?.despesas ?? null)
  const varSaldo = formatVariacao(saldo, saldoAnterior)

  // ── Inadimplência de prestadores ─────────────────────────────────────────
  const totalPrestadoresAtivos = prestadoresAtivos?.length ?? 0
  const inadimplenciaCount = prestadoresSemPagamento.length
  const inadimplenciaPct =
    totalPrestadoresAtivos > 0 ? Math.round((inadimplenciaCount / totalPrestadoresAtivos) * 100) : 0

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
      delta: varReceitas,
      deltaGood: receitas >= (mesAnterior?.receitas ?? receitas),
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20',
    },
    {
      title: 'Despesas do mês',
      value: formatCurrency(despesas),
      delta: varDespesas,
      deltaGood: despesas <= (mesAnterior?.despesas ?? despesas),
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/20',
    },
    {
      title: 'Saldo do mês',
      value: formatCurrency(saldo),
      delta: varSaldo,
      deltaGood: saldo >= (saldoAnterior ?? saldo),
      icon: Wallet,
      color: saldo >= 0 ? 'text-blue-400' : 'text-orange-400',
      bg: saldo >= 0 ? 'bg-blue-400/10' : 'bg-orange-400/10',
      border: saldo >= 0 ? 'border-blue-400/20' : 'border-orange-400/20',
    },
    {
      title: 'Contas a vencer',
      value: String(contasAVencer),
      delta: null,
      deltaGood: true,
      icon: AlertCircle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
    },
    {
      title: 'Inadimplência de prestadores',
      value: `${inadimplenciaCount}/${totalPrestadoresAtivos}`,
      delta: totalPrestadoresAtivos > 0 ? `${inadimplenciaPct}% sem pagamento` : null,
      deltaGood: inadimplenciaCount === 0,
      icon: Users,
      color: inadimplenciaCount === 0 ? 'text-green-400' : 'text-orange-400',
      bg: inadimplenciaCount === 0 ? 'bg-green-400/10' : 'bg-orange-400/10',
      border: inadimplenciaCount === 0 ? 'border-green-400/20' : 'border-orange-400/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Navegação de período */}
      <div className="flex items-center justify-between">
        <MesNav periodo={periodo} basePath="/dashboard" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
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
            {card.delta && (
              <p className={`text-xs mt-1.5 ${card.deltaGood ? 'text-green-400' : 'text-red-400'}`}>
                {card.delta}
              </p>
            )}
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
                  {p.nome} — sem pagamento registrado{' '}
                  {isMesAtual ? 'este mês' : `em ${mesNome}`}
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
