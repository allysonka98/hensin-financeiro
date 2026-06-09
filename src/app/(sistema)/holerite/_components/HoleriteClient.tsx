'use client'

import { useState } from 'react'
import { Download, Users } from 'lucide-react'
import type { Prestador, Bonificacao, Configuracao, Lancamento } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const TIPO_PGTO_LABEL: Record<string, string> = {
  adiantamento: 'Adiantamento',
  final: 'Pgto Final',
  bonus: 'Bônus',
  outro: 'Outro',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)
}

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function getLancamentosMes(
  lancamentos: Lancamento[],
  prestadorId: string,
  mes: number,
  ano: number
): Lancamento[] {
  const start = `${ano}-${String(mes).padStart(2, '0')}-01`
  const end = new Date(ano, mes, 0).toISOString().split('T')[0]
  return lancamentos.filter(
    (l) =>
      l.prestador_id === prestadorId &&
      l.data_competencia >= start &&
      l.data_competencia <= end &&
      l.status !== 'cancelado'
  )
}

// ─── HTML Generation ──────────────────────────────────────────────────────────

function gerarCSS(): string {
  return `    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #111;
      background: #fff;
      padding: 20mm;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 12mm; }
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 14px;
      margin-bottom: 22px;
    }
    .header h1 { font-size: 18px; font-weight: bold; letter-spacing: 0.5px; }
    .header p { margin-top: 3px; color: #555; font-size: 11px; }
    .title-box {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 10px 16px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title-box h2 { font-size: 14px; font-weight: bold; letter-spacing: 0.3px; }
    .title-box span { font-size: 12px; color: #555; }
    .section { margin-bottom: 22px; }
    .section h3 {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    table { width: 100%; border-collapse: collapse; }
    td, th {
      padding: 6px 10px;
      text-align: left;
      border: 1px solid #e5e7eb;
      font-size: 12px;
    }
    th { background: #f9fafb; font-weight: bold; }
    .td-label { color: #6b7280; width: 38%; }
    .td-right { text-align: right; }
    .tr-bonus td { color: #7c3aed; }
    .tr-deduct td { color: #dc2626; }
    .tr-total td {
      font-weight: bold;
      font-size: 13px;
      background: #f0fdf4;
      border-top: 2px solid #16a34a;
    }
    .signatures {
      margin-top: 48px;
      display: flex;
      justify-content: space-around;
    }
    .sig-block { text-align: center; width: 200px; }
    .sig-line {
      border-top: 1px solid #333;
      margin-top: 44px;
      margin-bottom: 6px;
    }
    .sig-name { font-size: 11px; }
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 9px;
      color: #9ca3af;
    }`
}

function gerarHoleriteBody(
  prestador: Prestador,
  mes: number,
  ano: number,
  bonusMes: Bonificacao | undefined,
  lancamentosMes: Lancamento[],
  configuracao: Configuracao | null
): string {
  const valorBase = prestador.valor_combinado ?? 0
  const bonus = bonusMes?.valor ?? 0
  const bonusDesc = bonusMes?.descricao ?? ''
  const adiantamentos = lancamentosMes
    .filter((l) => l.tipo_pagamento === 'adiantamento')
    .reduce((s, l) => s + l.valor, 0)
  const liquido = valorBase + bonus - adiantamentos

  const bankInfo = [
    prestador.banco,
    prestador.agencia && `Ag. ${prestador.agencia}`,
    prestador.conta && `C. ${prestador.conta}`,
  ]
    .filter(Boolean)
    .join(' · ')

  const empresa = configuracao?.nome_escritorio ?? 'Empresa'

  return `
  <div class="header">
    <h1>${empresa}</h1>
    ${configuracao?.cnpj ? `<p>CNPJ: ${configuracao.cnpj}</p>` : ''}
    ${configuracao?.endereco ? `<p>${configuracao.endereco}</p>` : ''}
    ${configuracao?.telefone ? `<p>Tel: ${configuracao.telefone}</p>` : ''}
    ${configuracao?.email ? `<p>E-mail: ${configuracao.email}</p>` : ''}
  </div>

  <div class="title-box">
    <h2>RECIBO DE PAGAMENTO</h2>
    <span>Competência: ${MESES[mes - 1]} / ${ano}</span>
  </div>

  <div class="section">
    <h3>Dados do Prestador</h3>
    <table>
      <tr><td class="td-label">Nome</td><td>${prestador.nome}</td></tr>
      <tr><td class="td-label">Função</td><td>${prestador.funcao}</td></tr>
      <tr><td class="td-label">CPF / CNPJ</td><td>${prestador.cpf_cnpj}</td></tr>
      ${prestador.data_nascimento ? `<tr><td class="td-label">Data de Nascimento</td><td>${formatDateBR(prestador.data_nascimento)}</td></tr>` : ''}
      ${prestador.pix ? `<tr><td class="td-label">PIX</td><td>${prestador.pix}</td></tr>` : ''}
      ${bankInfo ? `<tr><td class="td-label">Dados Bancários</td><td>${bankInfo}</td></tr>` : ''}
    </table>
  </div>

  <div class="section">
    <h3>Demonstrativo Financeiro</h3>
    <table>
      <thead>
        <tr><th>Descrição</th><th class="td-right">Valor (R$)</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Valor Base (Combinado)</td>
          <td class="td-right">${fmtBRL(valorBase)}</td>
        </tr>
        ${bonus > 0 ? `<tr class="tr-bonus">
          <td>Bonificação${bonusDesc ? ` — ${bonusDesc}` : ''}</td>
          <td class="td-right">+ ${fmtBRL(bonus)}</td>
        </tr>` : ''}
        ${adiantamentos > 0 ? `<tr class="tr-deduct">
          <td>Adiantamentos (a descontar)</td>
          <td class="td-right">− ${fmtBRL(adiantamentos)}</td>
        </tr>` : ''}
        <tr class="tr-total">
          <td>Total Líquido a Receber</td>
          <td class="td-right">${fmtBRL(liquido)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${lancamentosMes.length > 0 ? `
  <div class="section">
    <h3>Histórico de Pagamentos do Mês</h3>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Tipo</th>
          <th class="td-right">Valor (R$)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${lancamentosMes
          .map(
            (l) => `
        <tr>
          <td>${l.data_pagamento ? formatDateBR(l.data_pagamento) : l.data_competencia ? formatDateBR(l.data_competencia) : '—'}</td>
          <td>${l.descricao}</td>
          <td>${TIPO_PGTO_LABEL[l.tipo_pagamento ?? ''] ?? (l.tipo_pagamento ?? '—')}</td>
          <td class="td-right">${fmtBRL(l.valor)}</td>
          <td>${l.status === 'pago' ? 'Pago' : l.status === 'pendente' ? 'Pendente' : 'Cancelado'}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line"></div>
      <p class="sig-name">${empresa}</p>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <p class="sig-name">${prestador.nome}</p>
    </div>
  </div>

  <div class="footer">
    <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
  </div>`
}

function gerarHoleriteHTML(
  prestador: Prestador,
  mes: number,
  ano: number,
  bonusMes: Bonificacao | undefined,
  lancamentosMes: Lancamento[],
  configuracao: Configuracao | null
): string {
  const body = gerarHoleriteBody(
    prestador,
    mes,
    ano,
    bonusMes,
    lancamentosMes,
    configuracao
  )
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Holerite — ${prestador.nome} — ${MESES[mes - 1]}/${ano}</title>
  <style>
${gerarCSS()}
  </style>
</head>
<body>
${body}
</body>
</html>`
}

function baixarHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  prestadores: Prestador[]
  bonificacoes: Bonificacao[]
  configuracao: Configuracao | null
  lancamentos: Lancamento[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HoleriteClient({
  prestadores,
  bonificacoes,
  configuracao,
  lancamentos,
}: Props) {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [filtroPrestadorId, setFiltroPrestadorId] = useState('')

  const listagem = prestadores.filter((p) =>
    filtroPrestadorId ? p.id === filtroPrestadorId : true
  )

  function calcSummary(p: Prestador) {
    const valorBase = p.valor_combinado ?? 0
    const bonusMes = bonificacoes.find(
      (b) => b.prestador_id === p.id && b.mes === mes && b.ano === ano
    )
    const bonus = bonusMes?.valor ?? 0
    const lancsMes = getLancamentosMes(lancamentos, p.id, mes, ano)
    const adiantamentos = lancsMes
      .filter((l) => l.tipo_pagamento === 'adiantamento')
      .reduce((s, l) => s + l.valor, 0)
    const liquido = valorBase + bonus - adiantamentos
    return { valorBase, bonus, bonusMes, adiantamentos, liquido, lancsMes }
  }

  function handleBaixar(p: Prestador) {
    const { bonusMes, lancsMes } = calcSummary(p)
    const html = gerarHoleriteHTML(p, mes, ano, bonusMes, lancsMes, configuracao)
    const slug = p.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    baixarHTML(html, `holerite-${slug}-${String(mes).padStart(2, '0')}-${ano}.html`)
  }

  function handleBaixarTodos() {
    const empresa = configuracao?.nome_escritorio ?? 'Empresa'
    const css = gerarCSS()
    const bodies = listagem.map((p) => {
      const { bonusMes, lancsMes } = calcSummary(p)
      return gerarHoleriteBody(p, mes, ano, bonusMes, lancsMes, configuracao)
    })

    const combined = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Holerites — ${MESES[mes - 1]}/${ano} — ${empresa}</title>
  <style>
${css}
    .holerite-page { page-break-after: always; padding: 20mm; }
    .holerite-page:last-child { page-break-after: auto; }
    @media print {
      .holerite-page { padding: 0; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
${bodies.map((b) => `<div class="holerite-page">${b}</div>`).join('\n')}
</body>
</html>`

    baixarHTML(combined, `holerites-${String(mes).padStart(2, '0')}-${ano}.html`)
  }

  const INPUT =
    'px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-semibold">Holerite</h2>
          <p className="text-gray-400 text-sm mt-1">
            Gere recibos de pagamento por competência
          </p>
        </div>

        {listagem.length > 0 && (
          <button
            onClick={handleBaixarTodos}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar todos
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className={INPUT}
        >
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={2020}
          max={2099}
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className={`${INPUT} w-24`}
        />
        <select
          value={filtroPrestadorId}
          onChange={(e) => setFiltroPrestadorId(e.target.value)}
          className={INPUT}
        >
          <option value="">Todos os prestadores</option>
          {prestadores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {prestadores.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium">Nenhum prestador ativo</p>
            <p className="text-gray-500 text-sm mt-1">
              Cadastre prestadores ativos para gerar holerites
            </p>
          </div>
        </div>
      )}

      {/* Tabela */}
      {listagem.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-5 py-3 text-gray-400 font-medium">
                    Prestador
                  </th>
                  <th className="text-right px-5 py-3 text-gray-400 font-medium">
                    Valor Base
                  </th>
                  <th className="text-right px-5 py-3 text-gray-400 font-medium">
                    Bônus
                  </th>
                  <th className="text-right px-5 py-3 text-gray-400 font-medium">
                    Adiantamentos
                  </th>
                  <th className="text-right px-5 py-3 text-gray-400 font-medium">
                    Líquido
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {listagem.map((p) => {
                  const { valorBase, bonus, adiantamentos, liquido } =
                    calcSummary(p)
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">{p.nome}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {p.funcao}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right text-gray-300">
                        {fmt(valorBase)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {bonus > 0 ? (
                          <span className="text-purple-400 font-medium">
                            + {fmt(bonus)}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {adiantamentos > 0 ? (
                          <span className="text-red-400">
                            − {fmt(adiantamentos)}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-white font-semibold">
                          {fmt(liquido)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleBaixar(p)}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 bg-gray-700/50 hover:bg-blue-400/10 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-gray-600 text-xs">
        O arquivo gerado é um HTML — abra no navegador e use Ctrl+P para salvar como PDF.
      </p>
    </>
  )
}
