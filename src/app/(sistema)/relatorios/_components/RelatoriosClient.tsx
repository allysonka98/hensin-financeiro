'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { fmtCategoria } from '@/lib/utils'
import MesNav from '@/components/MesNav'

interface Lancamento {
  id: string
  tipo: string
  categoria: string
  descricao: string
  valor: number
  data_competencia: string
  data_pagamento: string | null
  status: string
  forma_pagamento: string | null
  prestador_id: string | null
  prestador: { id: string; nome: string } | null
}

interface Props {
  lancamentos: Lancamento[]
  mesAno: string
  periodo: string
  historico?: unknown[]
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function csvField(v: string | number): string {
  const s = String(v)
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvNum(v: number): string {
  return v.toFixed(2).replace('.', ',')
}

function downloadCSV(filename: string, linhas: string[]) {
  // BOM no início garante acentuação correta ao abrir no Excel
  const BOM = String.fromCharCode(0xfeff)
  const blob = new Blob([BOM + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function RelatoriosClient({ lancamentos, mesAno, periodo }: Props) {
  const receitas = lancamentos.filter(l => l.tipo === 'receita')
  const despesas = lancamentos.filter(l => l.tipo === 'despesa')
  const totalReceitas = receitas.reduce((s, l) => s + l.valor, 0)
  const totalDespesas = despesas.reduce((s, l) => s + l.valor, 0)
  const resultado = totalReceitas - totalDespesas

  const [view, setView] = useState<'financeiro' | 'prestadores'>('financeiro')
  const [loadingWord, setLoadingWord] = useState(false)

  const porPrestador = useMemo(() => {
    const map = new Map<
      string,
      { id: string; nome: string; totalPago: number; totalPendente: number; qtdPagamentos: number }
    >()
    lancamentos.forEach(l => {
      if (!l.prestador_id || !l.prestador) return
      const entry = map.get(l.prestador_id) ?? {
        id: l.prestador_id,
        nome: l.prestador.nome,
        totalPago: 0,
        totalPendente: 0,
        qtdPagamentos: 0,
      }
      if (l.status === 'pago') {
        entry.totalPago += l.valor
        entry.qtdPagamentos += 1
      } else if (l.status === 'pendente') {
        entry.totalPendente += l.valor
      }
      map.set(l.prestador_id, entry)
    })
    return Array.from(map.values()).sort((a, b) => b.totalPago - a.totalPago)
  }, [lancamentos])

  const exportWord = useCallback(async () => {
    setLoadingWord(true)
    try {
      const {
        Document, Paragraph, Table, TableRow, TableCell,
        TextRun, Packer, WidthType, HeadingLevel,
        AlignmentType, BorderStyle,
      } = await import('docx')

      const hoje = new Date().toLocaleDateString('pt-BR')

      const borders = {
        top:              { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
        bottom:           { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
        left:             { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
        right:            { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'DDDDDD' },
        insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: 'DDDDDD' },
      }

      const dreRows = [
        ['Receitas', fmt(totalReceitas)],
        ['Despesas', fmt(totalDespesas)],
        ['Resultado', fmt(resultado)],
      ]

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `HENSIN ADVOGADOS — Relatório Financeiro — ${mesAno}`, bold: true, size: 28 })],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({ text: 'DRE — Demonstrativo de Resultado', bold: true })],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders,
              rows: dreRows.map(([label, value], i) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: i === 2 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: value, bold: i === 2 })] })] }),
                  ],
                })
              ),
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({ text: 'Lançamentos do mês', bold: true })],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders,
              rows: [
                new TableRow({
                  children: ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status'].map(h =>
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })
                  ),
                }),
                ...lancamentos.map(l =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(l.data_competencia?.slice(0, 10) ?? '')] }),
                      new TableCell({ children: [new Paragraph(l.descricao ?? '')] }),
                      new TableCell({ children: [new Paragraph(fmtCategoria(l.categoria ?? ''))] }),
                      new TableCell({ children: [new Paragraph(l.tipo)] }),
                      new TableCell({ children: [new Paragraph(fmt(l.valor))] }),
                      new TableCell({ children: [new Paragraph(l.status)] }),
                    ],
                  })
                ),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [new TextRun({ text: `Gerado em ${hoje} por Hensin Financeiro`, color: '888888', size: 16 })],
            }),
          ],
        }],
      })

      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${mesAno.toLowerCase().replace(/\s/g, '-')}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setLoadingWord(false)
    }
  }, [lancamentos, mesAno, totalReceitas, totalDespesas, resultado])

  const exportCSV = useCallback(() => {
    const linhas = [
      ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status'].map(csvField).join(';'),
      ...lancamentos.map(l =>
        [
          l.data_competencia?.slice(0, 10) ?? '',
          l.descricao ?? '',
          fmtCategoria(l.categoria ?? ''),
          l.tipo === 'receita' ? 'Receita' : 'Despesa',
          csvNum(l.valor),
          l.status,
        ]
          .map(csvField)
          .join(';')
      ),
      '',
      ['Total Receitas', '', '', '', csvNum(totalReceitas), ''].map(csvField).join(';'),
      ['Total Despesas', '', '', '', csvNum(totalDespesas), ''].map(csvField).join(';'),
      ['Resultado', '', '', '', csvNum(resultado), ''].map(csvField).join(';'),
    ]
    downloadCSV(`relatorio-${mesAno.toLowerCase().replace(/\s/g, '-')}.csv`, linhas)
  }, [lancamentos, mesAno, totalReceitas, totalDespesas, resultado])

  const exportPrestadoresCSV = useCallback(() => {
    const linhas = [
      ['Prestador', 'Pagamentos', 'Total pago', 'Pendente'].map(csvField).join(';'),
      ...porPrestador.map(p =>
        [p.nome, String(p.qtdPagamentos), csvNum(p.totalPago), csvNum(p.totalPendente)]
          .map(csvField)
          .join(';')
      ),
    ]
    downloadCSV(`relatorio-prestadores-${mesAno.toLowerCase().replace(/\s/g, '-')}.csv`, linhas)
  }, [porPrestador, mesAno])

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210
    let y = 0

    // Cabeçalho
    doc.setFillColor(30, 58, 138)
    doc.rect(0, 0, W, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('HENSIN ADVOGADOS', 14, 12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Relatório Financeiro', 14, 20)
    doc.text(mesAno, W - 14, 20, { align: 'right' })
    y = 38

    // DRE
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('DRE — Demonstrativo de Resultado', 14, y)
    y += 8

    const rows = [
      ['Receitas', fmt(totalReceitas)],
      ['Despesas', fmt(totalDespesas)],
      ['Resultado', fmt(resultado)],
    ]

    rows.forEach(([label, value], i) => {
      const isResultado = i === 2
      if (isResultado) {
        doc.setFillColor(resultado >= 0 ? 220 : 255, resultado >= 0 ? 255 : 220, resultado >= 0 ? 220 : 220)
        doc.rect(14, y - 5, W - 28, 10, 'F')
      }
      doc.setFont('helvetica', isResultado ? 'bold' : 'normal')
      doc.setFontSize(10)
      doc.setTextColor(30, 30, 30)
      doc.text(label, 18, y)
      doc.text(value, W - 18, y, { align: 'right' })
      y += 10
    })

    y += 6

    // Tabela de lançamentos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Lançamentos do mês', 14, y)
    y += 8

    // Cabeçalho da tabela
    doc.setFillColor(50, 50, 50)
    doc.rect(14, y - 5, W - 28, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text('DATA', 18, y)
    doc.text('DESCRIÇÃO', 45, y)
    doc.text('CATEGORIA', 110, y)
    doc.text('TIPO', 145, y)
    doc.text('VALOR', W - 18, y, { align: 'right' })
    y += 8

    // Linhas
    lancamentos.forEach((l, i) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(14, y - 5, W - 28, 8, 'F')
      }
      doc.setTextColor(30, 30, 30)
      doc.setFont('helvetica', 'normal')
      doc.text(l.data_competencia?.slice(0, 10) ?? '', 18, y)
      doc.text(l.descricao?.slice(0, 30) ?? '', 45, y)
      doc.text(fmtCategoria(l.categoria ?? ''), 110, y)
      doc.setTextColor(l.tipo === 'receita' ? 0 : 180, l.tipo === 'receita' ? 150 : 0, 0)
      doc.text(l.tipo, 145, y)
      doc.setTextColor(30, 30, 30)
      doc.text(fmt(l.valor), W - 18, y, { align: 'right' })
      y += 8
    })

    // Rodapé
    const hoje = new Date().toLocaleDateString('pt-BR')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(`Gerado em ${hoje} por Hensin Financeiro`, 14, 287)

    // Download
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${mesAno.toLowerCase().replace(/\s/g, '-')}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [lancamentos, mesAno, totalReceitas, totalDespesas, resultado])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatórios</h1>
          <p className="text-gray-400 text-sm mt-1">{mesAno}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MesNav periodo={periodo} basePath="/relatorios" />
          {view === 'financeiro' ? (
            <>
              <button
                onClick={exportCSV}
                disabled={lancamentos.length === 0}
                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                📊 Exportar CSV
              </button>
              <button
                onClick={exportWord}
                disabled={loadingWord}
                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                {loadingWord ? '⏳' : '📄'} Exportar Word
              </button>
              <button
                onClick={exportPDF}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                ⬇ Exportar PDF
              </button>
            </>
          ) : (
            <button
              onClick={exportPrestadoresCSV}
              disabled={porPrestador.length === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              📊 Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setView('financeiro')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            view === 'financeiro'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Financeiro
        </button>
        <button
          onClick={() => setView('prestadores')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            view === 'prestadores'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Por Prestador
        </button>
      </div>

      {view === 'financeiro' && (
        <>
      {/* DRE */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">DRE — {mesAno}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Receitas</p>
            <p className="text-green-400 text-2xl font-bold">{fmt(totalReceitas)}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Despesas</p>
            <p className="text-red-400 text-2xl font-bold">{fmt(totalDespesas)}</p>
          </div>
          <div className={`rounded-xl p-4 border ${resultado >= 0 ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'}`}>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Resultado</p>
            <p className={`text-2xl font-bold ${resultado >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(resultado)}</p>
            <p className="text-xs text-gray-400 mt-1">{resultado >= 0 ? 'Superávit' : 'Déficit'} no período</p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Lançamentos do mês <span className="text-gray-400 font-normal text-sm">({lancamentos.length} registros)</span>
        </h2>
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Data</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Descrição</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Categoria</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Tipo</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Valor</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nenhum lançamento no período.</td></tr>
              ) : (
                lancamentos.map(l => (
                  <tr key={l.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-300">{l.data_competencia?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-white">{l.descricao}</td>
                    <td className="px-4 py-3 text-gray-300">{fmtCategoria(l.categoria ?? '')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${l.tipo === 'receita' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {l.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${l.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>
                      {fmt(l.valor)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${l.status === 'pago' ? 'bg-green-900 text-green-300' : l.status === 'pendente' ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-700 text-gray-300'}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {lancamentos.length > 0 && (
              <tfoot>
                <tr className="bg-gray-900 border-t border-gray-700">
                  <td colSpan={4} className="px-4 py-3 text-gray-400 font-medium">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-white">{fmt(totalReceitas + totalDespesas)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
        </>
      )}

      {view === 'prestadores' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Pagamentos por prestador{' '}
            <span className="text-gray-400 font-normal text-sm">
              ({porPrestador.length} prestador{porPrestador.length !== 1 ? 'es' : ''})
            </span>
          </h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Prestador</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Pagamentos</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Total pago</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Pendente</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {porPrestador.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Nenhum pagamento a prestadores no período.
                    </td>
                  </tr>
                ) : (
                  porPrestador.map(p => (
                    <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-white">{p.nome}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{p.qtdPagamentos}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-400">
                        {fmt(p.totalPago)}
                      </td>
                      <td className="px-4 py-3 text-right text-yellow-400">
                        {p.totalPendente > 0 ? fmt(p.totalPendente) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/prestadores/${p.id}`}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                        >
                          Ver histórico completo
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {porPrestador.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-900 border-t border-gray-700">
                    <td className="px-4 py-3 text-gray-400 font-medium">Total</td>
                    <td className="px-4 py-3 text-right text-gray-300 font-medium">
                      {porPrestador.reduce((s, p) => s + p.qtdPagamentos, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-400">
                      {fmt(porPrestador.reduce((s, p) => s + p.totalPago, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-yellow-400">
                      {fmt(porPrestador.reduce((s, p) => s + p.totalPendente, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  )
}