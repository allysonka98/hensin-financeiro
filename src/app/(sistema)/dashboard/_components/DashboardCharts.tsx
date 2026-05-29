// Server Component — pure SVG, no client-side JS needed

import { fmtCategoria } from '@/lib/utils'

const CAT_COLORS: Record<string, string> = {
  honorarios: '#60a5fa',
  prestador: '#f472b6',
  conta_fixa: '#a78bfa',
  imposto: '#fb923c',
  escritorio: '#4ade80',
  marketing: '#facc15',
  outros: '#94a3b8',
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function fmtMes(yyyymm: string) {
  const [y, m] = yyyymm.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', {
    month: 'short',
    year: '2-digit',
  })
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  start: number,
  end: number
): string {
  const capped = Math.min(end, start + 359.99)
  const s = polarToXY(cx, cy, outerR, start)
  const e = polarToXY(cx, cy, outerR, capped)
  const si = polarToXY(cx, cy, innerR, start)
  const ei = polarToXY(cx, cy, innerR, capped)
  const large = capped - start > 180 ? 1 : 0
  return `M${s.x.toFixed(2)},${s.y.toFixed(2)} A${outerR},${outerR} 0 ${large} 1 ${e.x.toFixed(2)},${e.y.toFixed(2)} L${ei.x.toFixed(2)},${ei.y.toFixed(2)} A${innerR},${innerR} 0 ${large} 0 ${si.x.toFixed(2)},${si.y.toFixed(2)}Z`
}

export interface MesData {
  mes: string
  receitas: number
  despesas: number
}

export interface CatData {
  categoria: string
  valor: number
}

export interface LancData {
  id: string
  descricao: string
  valor: number
  tipo: string
  status: string
  data_competencia: string
  categoria: string
}

interface Props {
  ultimos6Meses: MesData[]
  despesasPorCategoria: CatData[]
  ultimosLancamentos: LancData[]
}

export default function DashboardCharts({
  ultimos6Meses,
  despesasPorCategoria,
  ultimosLancamentos,
}: Props) {
  // ── Bar chart constants ──────────────────────────────────────────────────
  const W = 560, H = 200, PL = 56, PT = 15, PR = 15, PB = 42
  const chartW = W - PL - PR
  const chartH = H - PT - PB
  const maxVal = Math.max(...ultimos6Meses.flatMap(m => [m.receitas, m.despesas]), 1)
  const groupW = chartW / Math.max(ultimos6Meses.length, 1)
  const barW = Math.min(20, groupW * 0.33)
  const yTicks = [0, 0.25, 0.5, 0.75, 1]

  // ── Donut chart ──────────────────────────────────────────────────────────
  const totalCat = despesasPorCategoria.reduce((s, c) => s + c.valor, 0)
  let angle = 0
  const segments = despesasPorCategoria.map(c => {
    const sweep = totalCat > 0 ? (c.valor / totalCat) * 360 : 0
    const seg = {
      ...c,
      start: angle,
      end: angle + sweep,
      color: CAT_COLORS[c.categoria] ?? '#94a3b8',
      pct: totalCat > 0 ? Math.round((c.valor / totalCat) * 100) : 0,
    }
    angle += sweep
    return seg
  })

  return (
    <div className="space-y-4">
      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Bar chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-white font-semibold text-sm mb-3">
            Receitas vs Despesas — últimos 6 meses
          </h3>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
            {/* Grid lines + Y labels */}
            {yTicks.map((t, i) => {
              const gy = PT + chartH - t * chartH
              const label = t * maxVal
              const text =
                label >= 1000
                  ? `${(label / 1000).toFixed(0)}k`
                  : label.toFixed(0)
              return (
                <g key={i}>
                  <line
                    x1={PL} y1={gy} x2={W - PR} y2={gy}
                    stroke="#374151" strokeWidth="0.5"
                  />
                  <text
                    x={PL - 4} y={gy + 3.5}
                    textAnchor="end" fontSize="9" fill="#6b7280"
                  >
                    {text}
                  </text>
                </g>
              )
            })}

            {/* Bars */}
            {ultimos6Meses.map((m, i) => {
              const cx = PL + i * groupW + groupW / 2
              const rH = (m.receitas / maxVal) * chartH
              const dH = (m.despesas / maxVal) * chartH
              const rX = cx - barW - 1.5
              const dX = cx + 1.5
              return (
                <g key={m.mes}>
                  <rect
                    x={rX} y={PT + chartH - rH}
                    width={barW} height={Math.max(rH, 0)} fill="#4ade80" rx="2"
                  />
                  <rect
                    x={dX} y={PT + chartH - dH}
                    width={barW} height={Math.max(dH, 0)} fill="#f87171" rx="2"
                  />
                  <text
                    x={cx} y={H - PB + 14}
                    textAnchor="middle" fontSize="9" fill="#6b7280"
                  >
                    {fmtMes(m.mes)}
                  </text>
                </g>
              )
            })}
          </svg>
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />
              Receitas
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
              Despesas
            </span>
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-white font-semibold text-sm mb-3">
            Despesas por categoria — mês atual
          </h3>
          {totalCat === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">
              Sem despesas no período
            </p>
          ) : (
            <div className="flex items-center gap-5">
              <svg viewBox="0 0 200 200" className="w-36 h-36 shrink-0">
                {segments.length === 1 ? (
                  <circle cx="100" cy="100" r="80" fill={segments[0].color} />
                ) : (
                  segments
                    .filter(seg => seg.end - seg.start > 0.3)
                    .map((seg, i) => (
                      <path
                        key={i}
                        d={donutArc(100, 100, 80, 50, seg.start, seg.end)}
                        fill={seg.color}
                      />
                    ))
                )}
                <circle cx="100" cy="100" r="42" fill="#1f2937" />
              </svg>
              <ul className="space-y-2 flex-1 min-w-0">
                {segments.map((seg, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="truncate">
                      {fmtCategoria(seg.categoria)}
                    </span>
                    <span className="ml-auto text-gray-400 shrink-0">{seg.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Últimos 5 lançamentos */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700">
          <h3 className="text-white font-semibold text-sm">Últimos lançamentos</h3>
        </div>
        {ultimosLancamentos.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">
            Nenhum lançamento encontrado.
          </p>
        ) : (() => {
          const todayStr = new Date().toISOString().split('T')[0]
          return (
            <ul className="divide-y divide-gray-700/50">
              {ultimosLancamentos.map(l => {
                const isVencido = l.status === 'pendente' && l.data_competencia < todayStr
                const badgeClass = l.status === 'pago'
                  ? 'bg-green-900 text-green-300'
                  : isVencido
                  ? 'bg-red-900 text-red-300'
                  : l.status === 'pendente'
                  ? 'bg-yellow-900 text-yellow-300'
                  : 'bg-gray-700 text-gray-300'
                return (
                  <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{l.descricao}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {l.data_competencia?.slice(0, 10)}
                        {' · '}
                        <span>{fmtCategoria(l.categoria ?? '')}</span>
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium shrink-0 ${
                        l.tipo === 'receita' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {l.tipo === 'despesa' ? '-' : '+'}
                      {fmt(l.valor)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${badgeClass}`}>
                      {isVencido ? 'vencido' : l.status}
                    </span>
                  </li>
                )
              })}
            </ul>
          )
        })()}
      </div>
    </div>
  )
}
