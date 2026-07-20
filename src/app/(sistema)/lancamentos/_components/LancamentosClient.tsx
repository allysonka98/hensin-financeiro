'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  CheckCircle2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
} from 'lucide-react'
import {
  criarLancamento,
  marcarComoPago,
  excluirLancamento,
  editarLancamento,
} from '@/app/actions/lancamentos'
import type { Lancamento } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIAS: Record<string, string> = {
  honorarios: 'Honorários',
  prestador: 'Prestador',
  conta_fixa: 'Conta Fixa',
  imposto: 'Imposto',
  escritorio: 'Escritório',
  marketing: 'Marketing',
  outros: 'Outros',
}

const FORMAS_PAGAMENTO: Record<string, string> = {
  pix: 'PIX',
  transferencia: 'Transferência',
  boleto: 'Boleto',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pago: { label: 'Pago', cls: 'bg-green-400/15 text-green-400' },
  pendente: { label: 'Pendente', cls: 'bg-yellow-400/15 text-yellow-400' },
  cancelado: { label: 'Cancelado', cls: 'bg-gray-600/40 text-gray-400' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

function fmtMes(periodo: string) {
  const [y, m] = periodo.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

function prevMes(p: string) {
  const [y, m] = p.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMes(p: string) {
  const [y, m] = p.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const TODAY = new Date().toISOString().split('T')[0]

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT =
  'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const LABEL = 'block text-sm font-medium text-gray-300 mb-1'
const FILE_INPUT =
  'w-full text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600 file:cursor-pointer cursor-pointer'

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <h3 className="text-white font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ─── Criar Lançamento Form ────────────────────────────────────────────────────

interface LancamentoFormProps {
  contasFixas: { id: string; nome: string }[]
  prestadores: { id: string; nome: string }[]
  onSuccess: () => void
  onCancel: () => void
}

function LancamentoForm({
  contasFixas,
  prestadores,
  onSuccess,
  onCancel,
}: LancamentoFormProps) {
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(undefined)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await criarLancamento(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo */}
      <div>
        <label className={LABEL}>
          Tipo <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="tipo"
              value="receita"
              required
              className="accent-green-500"
            />
            <span className="text-green-400 font-medium">Receita</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="tipo"
              value="despesa"
              className="accent-red-500"
            />
            <span className="text-red-400 font-medium">Despesa</span>
          </label>
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label htmlFor="l-desc" className={LABEL}>
          Descrição <span className="text-red-400">*</span>
        </label>
        <input
          id="l-desc"
          name="descricao"
          required
          placeholder="Ex: Honorários contrato Silva"
          className={INPUT}
        />
      </div>

      {/* Categoria + Valor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="l-cat" className={LABEL}>
            Categoria <span className="text-red-400">*</span>
          </label>
          <select
            id="l-cat"
            name="categoria"
            required
            defaultValue=""
            className={INPUT}
          >
            <option value="" disabled>
              Selecione
            </option>
            {Object.entries(CATEGORIAS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="l-valor" className={LABEL}>
            Valor (R$) <span className="text-red-400">*</span>
          </label>
          <input
            id="l-valor"
            name="valor"
            type="number"
            required
            min={0}
            step="0.01"
            placeholder="0,00"
            className={INPUT}
          />
        </div>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="l-comp" className={LABEL}>
            Data competência <span className="text-red-400">*</span>
          </label>
          <input
            id="l-comp"
            name="data_competencia"
            type="date"
            required
            defaultValue={TODAY}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="l-pgto" className={LABEL}>
            Data pagamento
          </label>
          <input
            id="l-pgto"
            name="data_pagamento"
            type="date"
            className={INPUT}
          />
        </div>
      </div>

      {/* Forma de pagamento */}
      <div>
        <label htmlFor="l-forma" className={LABEL}>
          Forma de pagamento
        </label>
        <select
          id="l-forma"
          name="forma_pagamento"
          defaultValue=""
          className={INPUT}
        >
          <option value="">Selecione (opcional)</option>
          {Object.entries(FORMAS_PAGAMENTO).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Conta fixa + Prestador */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="l-cf" className={LABEL}>
            Conta fixa
          </label>
          <select
            id="l-cf"
            name="conta_fixa_id"
            defaultValue=""
            className={INPUT}
          >
            <option value="">Nenhuma</option>
            {contasFixas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="l-pre" className={LABEL}>
            Prestador
          </label>
          <select
            id="l-pre"
            name="prestador_id"
            defaultValue=""
            className={INPUT}
          >
            <option value="">Nenhum</option>
            {prestadores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Observações */}
      <div>
        <label htmlFor="l-obs" className={LABEL}>
          Observações
        </label>
        <textarea
          id="l-obs"
          name="observacoes"
          rows={2}
          placeholder="Opcional"
          className={`${INPUT} resize-none`}
        />
      </div>

      {/* Comprovante */}
      <div>
        <label htmlFor="l-file" className={LABEL}>
          Comprovante (imagem ou PDF)
        </label>
        <input
          id="l-file"
          name="comprovante"
          type="file"
          accept="image/*,.pdf"
          className={FILE_INPUT}
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors text-sm"
        >
          {isPending ? 'Salvando...' : 'Criar lançamento'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2 rounded-lg transition-colors text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Marcar como Pago Form ────────────────────────────────────────────────────

function PagarForm({
  lancamento,
  onSuccess,
  onCancel,
}: {
  lancamento: Lancamento
  onSuccess: () => void
  onCancel: () => void
}) {
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()
  const action = marcarComoPago.bind(null, lancamento.id)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(undefined)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await action(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Resumo do lançamento */}
      <div className="bg-gray-700/50 rounded-lg p-4 space-y-1">
        <p className="text-gray-300 text-sm">{lancamento.descricao}</p>
        <p
          className={`font-bold text-lg ${lancamento.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}
        >
          {fmt(lancamento.valor)}
        </p>
        <p className="text-gray-500 text-xs">
          Competência: {fmtDate(lancamento.data_competencia)}
        </p>
      </div>

      {/* Data de pagamento */}
      <div>
        <label htmlFor="p-data" className={LABEL}>
          Data de pagamento <span className="text-red-400">*</span>
        </label>
        <input
          id="p-data"
          name="data_pagamento"
          type="date"
          required
          defaultValue={TODAY}
          className={INPUT}
        />
      </div>

      {/* Comprovante */}
      <div>
        <label htmlFor="p-file" className={LABEL}>
          Comprovante (imagem ou PDF)
        </label>
        <input
          id="p-file"
          name="comprovante"
          type="file"
          accept="image/*,.pdf"
          className={FILE_INPUT}
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors text-sm"
        >
          {isPending ? 'Salvando...' : 'Confirmar pagamento'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2 rounded-lg transition-colors text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Editar Lançamento Form ───────────────────────────────────────────────────

function EditarForm({
  lancamento,
  contasFixas,
  prestadores,
  onSuccess,
  onCancel,
}: {
  lancamento: Lancamento
  contasFixas: { id: string; nome: string }[]
  prestadores: { id: string; nome: string }[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()
  const action = editarLancamento.bind(null, lancamento.id)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(undefined)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await action(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="comprovante_url_atual" value={lancamento.comprovante_url ?? ''} />

      {/* Tipo */}
      <div>
        <label className={LABEL}>
          Tipo <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="tipo"
              value="receita"
              required
              defaultChecked={lancamento.tipo === 'receita'}
              className="accent-green-500"
            />
            <span className="text-green-400 font-medium">Receita</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="tipo"
              value="despesa"
              defaultChecked={lancamento.tipo === 'despesa'}
              className="accent-red-500"
            />
            <span className="text-red-400 font-medium">Despesa</span>
          </label>
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label htmlFor="e-desc" className={LABEL}>
          Descrição <span className="text-red-400">*</span>
        </label>
        <input
          id="e-desc"
          name="descricao"
          required
          defaultValue={lancamento.descricao}
          className={INPUT}
        />
      </div>

      {/* Categoria + Valor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="e-cat" className={LABEL}>
            Categoria <span className="text-red-400">*</span>
          </label>
          <select
            id="e-cat"
            name="categoria"
            required
            defaultValue={lancamento.categoria}
            className={INPUT}
          >
            <option value="" disabled>
              Selecione
            </option>
            {Object.entries(CATEGORIAS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="e-valor" className={LABEL}>
            Valor (R$) <span className="text-red-400">*</span>
          </label>
          <input
            id="e-valor"
            name="valor"
            type="number"
            required
            min={0}
            step="0.01"
            defaultValue={lancamento.valor}
            className={INPUT}
          />
        </div>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="e-comp" className={LABEL}>
            Data competência <span className="text-red-400">*</span>
          </label>
          <input
            id="e-comp"
            name="data_competencia"
            type="date"
            required
            defaultValue={lancamento.data_competencia}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="e-pgto" className={LABEL}>
            Data pagamento
          </label>
          <input
            id="e-pgto"
            name="data_pagamento"
            type="date"
            defaultValue={lancamento.data_pagamento ?? ''}
            className={INPUT}
          />
        </div>
      </div>

      {/* Forma de pagamento */}
      <div>
        <label htmlFor="e-forma" className={LABEL}>
          Forma de pagamento
        </label>
        <select
          id="e-forma"
          name="forma_pagamento"
          defaultValue={lancamento.forma_pagamento ?? ''}
          className={INPUT}
        >
          <option value="">Selecione (opcional)</option>
          {Object.entries(FORMAS_PAGAMENTO).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Conta fixa + Prestador */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="e-cf" className={LABEL}>
            Conta fixa
          </label>
          <select
            id="e-cf"
            name="conta_fixa_id"
            defaultValue={lancamento.conta_fixa_id ?? ''}
            className={INPUT}
          >
            <option value="">Nenhuma</option>
            {contasFixas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="e-pre" className={LABEL}>
            Prestador
          </label>
          <select
            id="e-pre"
            name="prestador_id"
            defaultValue={lancamento.prestador_id ?? ''}
            className={INPUT}
          >
            <option value="">Nenhum</option>
            {prestadores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Observações */}
      <div>
        <label htmlFor="e-obs" className={LABEL}>
          Observações
        </label>
        <textarea
          id="e-obs"
          name="observacoes"
          rows={2}
          defaultValue={lancamento.observacoes ?? ''}
          className={`${INPUT} resize-none`}
        />
      </div>

      {/* Comprovante */}
      <div>
        <label htmlFor="e-file" className={LABEL}>
          Novo comprovante (substitui o atual)
        </label>
        {lancamento.comprovante_url && (
          <p className="text-xs text-gray-500 mb-1">
            Atual:{' '}
            <a
              href={lancamento.comprovante_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              ver arquivo
            </a>
          </p>
        )}
        <input
          id="e-file"
          name="comprovante"
          type="file"
          accept="image/*,.pdf"
          className={FILE_INPUT}
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors text-sm"
        >
          {isPending ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2 rounded-lg transition-colors text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type ModalState =
  | { type: 'closed' }
  | { type: 'criar' }
  | { type: 'pagar'; lancamento: Lancamento }
  | { type: 'editar'; lancamento: Lancamento }

interface Props {
  lancamentos: Lancamento[]
  contasFixas: { id: string; nome: string }[]
  prestadores: { id: string; nome: string }[]
  periodo: string
}

export default function LancamentosClient({
  lancamentos,
  contasFixas,
  prestadores,
  periodo,
}: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalState>({ type: 'closed' })
  const [filtroTipo, setFiltroTipo] = useState<
    'todos' | 'receita' | 'despesa'
  >('todos')
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'pendente' | 'pago' | 'cancelado'
  >('todos')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPendingDelete, startDeleteTransition] = useTransition()
  const modalKey = useRef(0)

  function openCriar() {
    modalKey.current += 1
    setModal({ type: 'criar' })
  }

  function openPagar(l: Lancamento) {
    modalKey.current += 1
    setModal({ type: 'pagar', lancamento: l })
  }

  function openEditar(l: Lancamento) {
    modalKey.current += 1
    setModal({ type: 'editar', lancamento: l })
  }

  function closeModal() {
    setModal({ type: 'closed' })
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este lançamento? Esta ação não pode ser desfeita.'))
      return
    setDeletingId(id)
    startDeleteTransition(async () => {
      await excluirLancamento(id)
      setDeletingId(null)
    })
  }

  // ── Filtragem ──────────────────────────────────────────────────────────────

  const filtrados = lancamentos.filter((l) => {
    if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false
    if (filtroStatus !== 'todos' && l.status !== filtroStatus) return false
    return true
  })

  const totalReceitas = filtrados
    .filter((l) => l.tipo === 'receita' && l.status === 'pago')
    .reduce((s, l) => s + l.valor, 0)

  const totalDespesas = filtrados
    .filter((l) => l.tipo === 'despesa' && l.status === 'pago')
    .reduce((s, l) => s + l.valor, 0)

  const saldo = totalReceitas - totalDespesas

  const selectCls =
    'px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <>
      {/* Controles: período + filtros + botão novo */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Navegação de período */}
        <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1">
          <button
            onClick={() =>
              router.push(`/lancamentos?mes=${prevMes(periodo)}`)
            }
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white text-sm font-medium px-2 w-44 text-center capitalize">
            {fmtMes(periodo)}
          </span>
          <button
            onClick={() =>
              router.push(`/lancamentos?mes=${nextMes(periodo)}`)
            }
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tipo */}
        <select
          value={filtroTipo}
          onChange={(e) =>
            setFiltroTipo(e.target.value as typeof filtroTipo)
          }
          className={selectCls}
        >
          <option value="todos">Todos os tipos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>

        {/* Status */}
        <select
          value={filtroStatus}
          onChange={(e) =>
            setFiltroStatus(e.target.value as typeof filtroStatus)
          }
          className={selectCls}
        >
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <div className="ml-auto">
          <button
            onClick={openCriar}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                {[
                  'Data',
                  'Descrição',
                  'Categoria',
                  'Tipo',
                  'Valor',
                  'Status',
                  '',
                ].map((h, i) => (
                  <th
                    key={i}
                    className={`text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 ${
                      i === 4 || i === 6
                        ? 'text-right'
                        : i === 3 || i === 5
                          ? 'text-center'
                          : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-700">
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-gray-500 py-12 text-sm"
                  >
                    Nenhum lançamento encontrado para este período.
                  </td>
                </tr>
              ) : (
                filtrados.map((l) => {
                  const isReceita = l.tipo === 'receita'
                  const statusCfg = STATUS_CONFIG[l.status] ?? {
                    label: l.status,
                    cls: 'bg-gray-600/40 text-gray-400',
                  }
                  const isDeleting = deletingId === l.id

                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-gray-750 transition-colors ${isDeleting ? 'opacity-40' : ''}`}
                    >
                      {/* Data */}
                      <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">
                        {fmtDate(l.data_competencia)}
                      </td>

                      {/* Descrição */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-white text-sm truncate">
                          {l.descricao}
                        </p>
                        {l.data_pagamento && (
                          <p className="text-gray-500 text-xs mt-0.5">
                            Pago {fmtDate(l.data_pagamento)}
                          </p>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {CATEGORIAS[l.categoria] ?? l.categoria}
                      </td>

                      {/* Tipo */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isReceita
                              ? 'bg-green-400/15 text-green-400'
                              : 'bg-red-400/15 text-red-400'
                          }`}
                        >
                          {isReceita ? 'Receita' : 'Despesa'}
                        </span>
                      </td>

                      {/* Valor */}
                      <td
                        className={`px-4 py-3 text-right text-sm font-semibold ${
                          isReceita ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {fmt(l.valor)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {l.comprovante_url && (
                            <a
                              href={l.comprovante_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors rounded"
                              title="Ver comprovante"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {l.status === 'pendente' && (
                            <button
                              onClick={() => openPagar(l)}
                              className="p-1.5 text-gray-400 hover:text-green-400 transition-colors rounded"
                              title="Marcar como pago"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditar(l)}
                            className="p-1.5 text-gray-400 hover:text-yellow-400 transition-colors rounded"
                            title="Editar lançamento"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(l.id)}
                            disabled={isPendingDelete}
                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded disabled:opacity-50"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>

            {/* Totalizadores */}
            {filtrados.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-600 bg-gray-700/40">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-gray-400 text-sm font-medium"
                  >
                    Totais pagos no período
                  </td>
                  <td colSpan={3} className="px-4 py-3">
                    <div className="flex items-center justify-end gap-5 text-sm font-semibold">
                      <span className="text-green-400" title="Receitas pagas">
                        ↑ {fmt(totalReceitas)}
                      </span>
                      <span className="text-red-400" title="Despesas pagas">
                        ↓ {fmt(totalDespesas)}
                      </span>
                      <span
                        className={
                          saldo >= 0 ? 'text-blue-400' : 'text-orange-400'
                        }
                        title="Saldo"
                      >
                        = {fmt(saldo)}
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal.type !== 'closed' && (
        <Modal
          key={modalKey.current}
          title={
            modal.type === 'criar'
              ? 'Novo Lançamento'
              : modal.type === 'editar'
                ? 'Editar Lançamento'
                : 'Marcar como pago'
          }
          onClose={closeModal}
        >
          {modal.type === 'criar' ? (
            <LancamentoForm
              contasFixas={contasFixas}
              prestadores={prestadores}
              onSuccess={closeModal}
              onCancel={closeModal}
            />
          ) : modal.type === 'editar' ? (
            <EditarForm
              lancamento={modal.lancamento}
              contasFixas={contasFixas}
              prestadores={prestadores}
              onSuccess={closeModal}
              onCancel={closeModal}
            />
          ) : (
            <PagarForm
              lancamento={modal.lancamento}
              onSuccess={closeModal}
              onCancel={closeModal}
            />
          )}
        </Modal>
      )}
    </>
  )
}
