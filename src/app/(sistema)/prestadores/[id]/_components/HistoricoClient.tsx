'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Paperclip,
  DollarSign,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { salvarRecibo, editarLancamentoPrestador } from '@/app/actions/prestadores'
import type { Lancamento, Prestador } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMAS_PAGAMENTO: Record<string, string> = {
  pix: 'PIX',
  transferencia: 'Transferencia',
  boleto: 'Boleto',
  cartao_credito: 'Cartao de Credito',
  cartao_debito: 'Cartao de Debito',
  dinheiro: 'Dinheiro',
}

const FORMAS_PAGAMENTO_LABEL: Record<string, string> = {
  pix: 'PIX',
  transferencia: 'Transferência',
  boleto: 'Boleto',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
}

const TIPO_PAGAMENTO: Record<string, string> = {
  adiantamento: 'Adiantamento',
  parcial: 'Pagamento Parcial',
  final: 'Pagamento Final',
  bonus: 'Bonus',
  outro: 'Outro',
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pago: {
    label: 'Pago',
    cls: 'bg-green-400/15 text-green-400',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  pendente: {
    label: 'Pendente',
    cls: 'bg-yellow-400/15 text-yellow-400',
    icon: <Clock className="w-3 h-3" />,
  },
  cancelado: {
    label: 'Cancelado',
    cls: 'bg-gray-600/40 text-gray-400',
    icon: <XCircle className="w-3 h-3" />,
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

function fmtMesAno(iso: string): string {
  const [y, m] = iso.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// ─── jsPDF recibo ─────────────────────────────────────────────────────────────

async function generateReciboPDF(
  lancamento: Lancamento,
  prestador: Prestador
): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const PW = 210
  const L = 20
  const R = 190
  let y = 22

  const setBold = (size: number) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
  }
  const setNormal = (size: number) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
  }
  const hLine = (yy: number) => doc.line(L, yy, R, yy)

  // ── Header ─────────────────────────────────────────────────────────────────
  setBold(18)
  doc.setTextColor(30, 30, 30)
  doc.text('HENSIN ADVOGADOS', PW / 2, y, { align: 'center' })
  y += 7

  setNormal(10)
  doc.setTextColor(80, 80, 80)
  doc.text('RECIBO DE PAGAMENTO DE SERVICOS', PW / 2, y, { align: 'center' })
  y += 7

  doc.setDrawColor(180, 180, 180)
  hLine(y)
  y += 5

  // Numero + Data + Local
  const reciboNum = `REC-${lancamento.data_competencia.substring(0, 7).replace('-', '/')}-${lancamento.id.substring(0, 8).toUpperCase()}`
  setNormal(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`No: ${reciboNum}`, L, y)
  doc.text(`Data: ${fmtDate(lancamento.data_competencia)}`, PW / 2, y, { align: 'center' })
  doc.text('Local: Guarulhos, SP', R, y, { align: 'right' })
  y += 8

  doc.setDrawColor(180, 180, 180)
  hLine(y)
  y += 6

  // ── Dados do prestador ─────────────────────────────────────────────────────
  setBold(9)
  doc.setTextColor(30, 30, 30)
  doc.text('DADOS DO PRESTADOR', L, y)
  y += 5

  setNormal(9)
  doc.setTextColor(50, 50, 50)
  doc.text(`Nome: ${prestador.nome}`, L, y); y += 5
  doc.text(`CPF/CNPJ: ${prestador.cpf_cnpj}`, L, y); y += 5
  doc.text(`Cargo/Funcao: ${prestador.funcao}`, L, y); y += 8

  doc.setDrawColor(180, 180, 180)
  hLine(y)
  y += 6

  // ── Referencia ─────────────────────────────────────────────────────────────
  setBold(9)
  doc.setTextColor(30, 30, 30)
  doc.text('REFERENCIA DO PAGAMENTO', L, y)
  y += 5

  setNormal(9)
  doc.setTextColor(50, 50, 50)
  const mesComp = fmtMesAno(lancamento.data_competencia)
  doc.text(`Competencia: ${mesComp}`, L, y)
  const tipoLabel =
    TIPO_PAGAMENTO[lancamento.tipo_pagamento ?? ''] ??
    lancamento.tipo_pagamento ??
    '-'
  doc.text(`Tipo: ${tipoLabel}`, PW / 2, y)
  y += 8

  doc.setDrawColor(180, 180, 180)
  hLine(y)
  y += 6

  // ── Discriminacao dos valores ──────────────────────────────────────────────
  setBold(9)
  doc.setTextColor(30, 30, 30)
  doc.text('DISCRIMINACAO DOS VALORES', L, y)
  y += 5

  doc.setTextColor(50, 50, 50)
  const hasBreakdown = lancamento.valor_fixo != null

  if (hasBreakdown) {
    setNormal(9)
    doc.text('Valor fixo combinado:', L + 4, y)
    doc.text(fmt(lancamento.valor_fixo!), R, y, { align: 'right' })
    y += 5

    const adic = lancamento.valor_adicional ?? 0
    if (adic > 0) {
      const adicLabel = lancamento.motivo_adicional
        ? `Adicional (${lancamento.motivo_adicional}):`
        : 'Adicional:'
      doc.text(adicLabel, L + 4, y)
      doc.text(fmt(adic), R, y, { align: 'right' })
      y += 5
    }

    doc.setDrawColor(150, 150, 150)
    doc.line(L + 4, y, R, y)
    y += 4

    setBold(10)
    doc.setTextColor(20, 20, 20)
    doc.text('TOTAL LIQUIDO:', L + 4, y)
    doc.text(fmt(lancamento.valor), R, y, { align: 'right' })
    y += 8
  } else {
    setNormal(9)
    doc.text('Valor do pagamento:', L + 4, y)
    setBold(10)
    doc.setTextColor(20, 20, 20)
    doc.text(fmt(lancamento.valor), R, y, { align: 'right' })
    y += 8
  }

  doc.setDrawColor(180, 180, 180)
  hLine(y)
  y += 6

  // ── Forma de pagamento ─────────────────────────────────────────────────────
  setBold(9)
  doc.setTextColor(30, 30, 30)
  doc.text('FORMA DE PAGAMENTO', L, y)
  y += 5

  setNormal(9)
  doc.setTextColor(50, 50, 50)
  const formaLabel =
    FORMAS_PAGAMENTO[lancamento.forma_pagamento ?? ''] ??
    lancamento.forma_pagamento ??
    'Nao informado'
  doc.text(`Forma: ${formaLabel}`, L, y)
  if (prestador.pix) {
    doc.text(`Chave PIX: ${prestador.pix}`, PW / 2, y)
  }
  y += 5

  if (lancamento.observacoes) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    const lines = doc.splitTextToSize(`Obs: ${lancamento.observacoes}`, R - L)
    doc.text(lines, L, y)
    y += (lines.length as number) * 4.5
  }

  y += 8
  doc.setDrawColor(180, 180, 180)
  hLine(y)
  y += 10

  // ── Assinaturas ────────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  setNormal(9)
  doc.setTextColor(50, 50, 50)
  doc.text(`Guarulhos, ${today}`, PW / 2, y, { align: 'center' })
  y += 14

  const cX1 = L + (R - L) * 0.25
  const cX2 = L + (R - L) * 0.75
  const sigHalf = 38

  doc.setDrawColor(80, 80, 80)
  doc.line(cX1 - sigHalf, y, cX1 + sigHalf, y)
  doc.line(cX2 - sigHalf, y, cX2 + sigHalf, y)
  y += 5

  setNormal(8)
  doc.setTextColor(50, 50, 50)
  doc.text(prestador.nome, cX1, y, { align: 'center' })
  doc.text('Hensin Advogados', cX2, y, { align: 'center' })
  y += 4

  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text('Assinatura do Prestador', cX1, y, { align: 'center' })
  doc.text('Responsavel pelo Escritorio', cX2, y, { align: 'center' })
  y += 14

  // ── Rodape ─────────────────────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200)
  hLine(y)
  y += 4

  doc.setFontSize(7)
  doc.setTextColor(160, 160, 160)
  doc.text(
    `Documento gerado automaticamente pelo sistema Hensin Financeiro em ${new Date().toLocaleString('pt-BR')}`,
    PW / 2,
    y,
    { align: 'center' }
  )

  return doc.output('blob') as Blob
}

function EditarLancamentoModal({
  lancamento,
  onClose,
  onSaved,
}: {
  lancamento: Lancamento
  onClose: () => void
  onSaved: (updated: Lancamento) => void
}) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setErr(null)

    const formData = new FormData(e.currentTarget)
    const result = await editarLancamentoPrestador(lancamento.id, undefined, formData)

    if (result?.error) {
      setErr(result.error)
      setSaving(false)
    } else {
      // Montar objeto atualizado localmente para feedback imediato
      const valorFixo = formData.get("valor_fixo") ? Number(formData.get("valor_fixo")) : null
      const valorAdicional = formData.get("valor_adicional") ? Number(formData.get("valor_adicional")) : 0
      onSaved({
        ...lancamento,
        descricao: formData.get("descricao") as string,
        valor: Number(formData.get("valor")),
        data_competencia: formData.get("data_competencia") as string,
        data_pagamento: (formData.get("data_pagamento") as string) || null,
        status: formData.get("data_pagamento") ? "pago" : "pendente",
        forma_pagamento: (formData.get("forma_pagamento") as string) || null,
        observacoes: (formData.get("observacoes") as string) || null,
        valor_fixo: valorFixo,
        valor_adicional: valorAdicional,
        motivo_adicional: (formData.get("motivo_adicional") as string) || null,
        tipo_pagamento: (formData.get("tipo_pagamento") as string) || null,
      } as Lancamento)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h3 className="text-white font-semibold text-base">Editar Lançamento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Descrição</label>
              <input
                name="descricao"
                defaultValue={lancamento.descricao}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Valor Total (R$)</label>
              <input
                name="valor"
                type="number"
                step="0.01"
                min="0"
                defaultValue={lancamento.valor}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Competência</label>
              <input
                name="data_competencia"
                type="date"
                defaultValue={lancamento.data_competencia}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            {lancamento.valor_fixo != null && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Valor Fixo (R$)</label>
                  <input
                    name="valor_fixo"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={lancamento.valor_fixo ?? ""}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Adicional (R$)</label>
                  <input
                    name="valor_adicional"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={lancamento.valor_adicional ?? 0}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Motivo do Adicional</label>
                  <input
                    name="motivo_adicional"
                    defaultValue={lancamento.motivo_adicional ?? ""}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1">Data de Pagamento</label>
              <input
                name="data_pagamento"
                type="date"
                defaultValue={lancamento.data_pagamento ?? ""}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Forma de Pagamento</label>
              <select
                name="forma_pagamento"
                defaultValue={lancamento.forma_pagamento ?? ""}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">— Selecione —</option>
                {Object.entries(FORMAS_PAGAMENTO_LABEL).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Tipo de Pagamento</label>
              <select
                name="tipo_pagamento"
                defaultValue={lancamento.tipo_pagamento ?? ""}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">— Selecione —</option>
                {Object.entries(TIPO_PAGAMENTO).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Observações</label>
              <textarea
                name="observacoes"
                defaultValue={lancamento.observacoes ?? ""}
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          {err && <p className="text-red-400 text-xs">{err}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Recibo cell ─────────────────────────────────────────────────────────────

function ReciboCell({
  lancamento,
  prestador,
}: {
  lancamento: Lancamento
  prestador: Prestador
}) {
  const [loading, setLoading] = useState(false)
  const [reciboUrl, setReciboUrl] = useState<string | null>(
    lancamento.recibo_url ?? null
  )
  const [err, setErr] = useState<string | null>(null)

  async function handle() {
    setLoading(true)
    setErr(null)
    try {
      const blob = await generateReciboPDF(lancamento, prestador)

      // Download
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const slug = prestador.nome.replace(/\s+/g, '-').toLowerCase()
      a.href = objUrl
      a.download = `recibo-${slug}-${lancamento.data_competencia.substring(0, 7)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000)

      // Salvar no Supabase
      const arr = await blob.arrayBuffer()
      const b64 = arrayBufferToBase64(arr)
      const result = await salvarRecibo(lancamento.id, b64)
      if (result?.error) {
        setErr(result.error)
      } else if (result?.url) {
        setReciboUrl(result.url)
      }
    } catch (e) {
      setErr('Erro ao gerar recibo.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {reciboUrl && (
        <a
          href={reciboUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Ver recibo salvo"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
      <button
        onClick={handle}
        disabled={loading}
        title={reciboUrl ? 'Regenerar recibo' : 'Gerar recibo PDF'}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          reciboUrl
            ? 'text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700'
            : 'text-purple-400 hover:text-white bg-purple-400/10 hover:bg-purple-500/20 border border-purple-400/20'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileText className="w-3.5 h-3.5" />
        )}
        {loading ? 'Gerando...' : reciboUrl ? 'Regenerar' : 'Gerar Recibo'}
      </button>
      {err && <p className="text-red-400 text-xs w-full mt-0.5">{err}</p>}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  prestador: Prestador
  lancamentos: Lancamento[]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HistoricoClient({ prestador, lancamentos: initialLancamentos }: Props) {
  const [lancamentos, setLancamentos] = useState(initialLancamentos)
  const [editando, setEditando] = useState<Lancamento | null>(null)

  function handleSaved(updated: Lancamento) {
    setLancamentos((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
  }

  const totalPago = lancamentos
    .filter((l) => l.status === 'pago')
    .reduce((s, l) => s + l.valor, 0)

  const bankInfo = [
    prestador.banco,
    prestador.agencia && `Ag. ${prestador.agencia}`,
    prestador.conta && `C. ${prestador.conta}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/prestadores"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Prestadores
      </Link>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-semibold">{prestador.nome}</h2>
          <p className="text-gray-400 text-sm mt-0.5">{prestador.funcao}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs uppercase tracking-wider">
            Total pago
          </p>
          <p className="text-green-400 text-xl font-bold">{fmt(totalPago)}</p>
        </div>
      </div>

      {/* Card de dados */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        {prestador.cpf_cnpj && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">
              CPF / CNPJ
            </p>
            <p className="text-gray-200">{prestador.cpf_cnpj}</p>
          </div>
        )}
        {prestador.valor_combinado != null && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500 shrink-0" />
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">
                Valor combinado
              </p>
              <p className="text-gray-200">
                {fmt(prestador.valor_combinado)}/mês
              </p>
            </div>
          </div>
        )}
        {prestador.pix && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">
              Chave PIX
            </p>
            <p className="text-purple-300">{prestador.pix}</p>
          </div>
        )}
        {prestador.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500 shrink-0" />
            <p className="text-gray-200 truncate">{prestador.email}</p>
          </div>
        )}
        {prestador.telefone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500 shrink-0" />
            <p className="text-gray-200">{prestador.telefone}</p>
          </div>
        )}
        {bankInfo && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
            <p className="text-gray-200 truncate">{bankInfo}</p>
          </div>
        )}
      </div>

      {/* Tabela de lançamentos */}
      <div>
        <h3 className="text-white font-semibold mb-3 text-base">
          Histórico de pagamentos
          <span className="text-gray-500 font-normal text-sm ml-2">
            ({lancamentos.length} registro{lancamentos.length !== 1 ? 's' : ''})
          </span>
        </h3>

        {lancamentos.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
            <p className="text-gray-500 text-sm">
              Nenhum lançamento encontrado para este prestador.
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    {[
                      'Competência',
                      'Descrição',
                      'Valor',
                      'Status',
                      'Comprovante',
                      'Recibo',
                      'Editar',
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 ${
                          i === 2 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {lancamentos.map((l) => {
                    const statusCfg =
                      STATUS_CONFIG[l.status] ?? STATUS_CONFIG.cancelado
                    return (
                      <tr key={l.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">
                          <p>{fmtMesAno(l.data_competencia)}</p>
                          <p className="text-gray-500 text-xs">
                            {fmtDate(l.data_competencia)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[220px]">
                          <p className="text-gray-200 truncate">{l.descricao}</p>
                          {l.tipo_pagamento && (
                            <p className="text-gray-500 text-xs mt-0.5">
                              {TIPO_PAGAMENTO[l.tipo_pagamento] ??
                                l.tipo_pagamento}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium whitespace-nowrap text-green-400">
                          {fmt(l.valor)}
                          {l.valor_fixo != null &&
                            (l.valor_adicional ?? 0) > 0 && (
                              <p className="text-gray-500 font-normal text-xs">
                                +{fmt(l.valor_adicional!)} adicional
                              </p>
                            )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}
                          >
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                          {l.data_pagamento && (
                            <p className="text-gray-500 text-xs mt-0.5">
                              {fmtDate(l.data_pagamento)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {l.comprovante_url ? (
                            <a
                              href={l.comprovante_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver comprovante"
                              className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 bg-green-400/10 hover:bg-green-400/20 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              Ver
                            </a>
                          ) : (
                            <span className="text-gray-600 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ReciboCell
                            lancamento={l}
                            prestador={prestador}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setEditando(l)}
                            className="inline-flex items-center gap-1.5 text-xs text-yellow-400 hover:text-white bg-yellow-400/10 hover:bg-yellow-500/20 px-2.5 py-1.5 rounded-lg transition-colors border border-yellow-400/20"
                            title="Editar lançamento"
                          >
                            ✏️ Editar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-600 bg-gray-700/40">
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-gray-400 text-sm font-medium"
                    >
                      Total pago
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 text-sm font-bold whitespace-nowrap">
                      {fmt(totalPago)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
      {editando && (
        <EditarLancamentoModal
          lancamento={editando}
          onClose={() => setEditando(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}