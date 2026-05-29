'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  History,
  DollarSign,
  Phone,
  Mail,
  Building2,
  UserX,
  AlertCircle,
  FileText,
} from 'lucide-react'
import {
  criarPrestador,
  atualizarPrestador,
  excluirPrestador,
  lancarPagamentoPrestador,
} from '@/app/actions/prestadores'
import type { PrestadorComStatus } from '../page'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_PRESTADOR: Record<
  string,
  { label: string; cls: string }
> = {
  ativo: { label: 'Ativo', cls: 'bg-green-400/15 text-green-400' },
  inativo: { label: 'Inativo', cls: 'bg-gray-600/40 text-gray-400' },
  suspenso: { label: 'Suspenso', cls: 'bg-yellow-400/15 text-yellow-400' },
}

const STATUS_MES: Record<string, { label: string; cls: string }> = {
  pago: { label: 'Pago este mês', cls: 'bg-green-400/10 text-green-400' },
  pendente: { label: 'Pendente este mês', cls: 'bg-yellow-400/10 text-yellow-400' },
}

const TIPO_LABEL: Record<string, string> = {
  pessoa_fisica: 'PF',
  pessoa_juridica: 'PJ',
}

const FORMAS_PAGAMENTO: Record<string, string> = {
  pix: 'PIX',
  transferencia: 'Transferência',
  boleto: 'Boleto',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
}

const TIPO_PAGAMENTO: Record<string, string> = {
  adiantamento: 'Adiantamento (parcial)',
  final: 'Pagamento Final',
  bonus: 'Bônus',
  outro: 'Outro',
}

const TIPO_BTN_LABEL: Record<string, string> = {
  adiantamento: 'Adiantamento',
  final: 'Pagamento Final',
  bonus: 'Bônus',
  outro: 'Pagamento',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)
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

// ─── Prestador Form (criar / editar) ─────────────────────────────────────────

function PrestadorForm({
  prestador,
  onSuccess,
  onCancel,
}: {
  prestador?: PrestadorComStatus | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  const serverAction = prestador
    ? atualizarPrestador.bind(null, prestador.id)
    : criarPrestador

  function handleAction(formData: FormData) {
    setError(undefined)
    startTransition(async () => {
      const result = await serverAction(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <form action={handleAction} className="space-y-4">
      {/* Nome */}
      <div>
        <label htmlFor="p-nome" className={LABEL}>
          Nome <span className="text-red-400">*</span>
        </label>
        <input
          id="p-nome"
          name="nome"
          required
          defaultValue={prestador?.nome ?? ''}
          placeholder="Nome completo ou razão social"
          className={INPUT}
        />
      </div>

      {/* CPF/CNPJ + Tipo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="p-doc" className={LABEL}>
            CPF / CNPJ <span className="text-red-400">*</span>
          </label>
          <input
            id="p-doc"
            name="cpf_cnpj"
            required
            defaultValue={prestador?.cpf_cnpj ?? ''}
            placeholder="000.000.000-00"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="p-tipo" className={LABEL}>
            Tipo <span className="text-red-400">*</span>
          </label>
          <select
            id="p-tipo"
            name="tipo"
            required
            defaultValue={prestador?.tipo ?? 'pessoa_juridica'}
            className={INPUT}
          >
            <option value="pessoa_juridica">PJ — Pessoa Jurídica</option>
            <option value="pessoa_fisica">PF — Pessoa Física</option>
          </select>
        </div>
      </div>

      {/* Função + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="p-funcao" className={LABEL}>
            Função <span className="text-red-400">*</span>
          </label>
          <input
            id="p-funcao"
            name="funcao"
            required
            defaultValue={prestador?.funcao ?? ''}
            placeholder="Ex: Desenvolvedor Frontend"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="p-status" className={LABEL}>
            Status <span className="text-red-400">*</span>
          </label>
          <select
            id="p-status"
            name="status"
            required
            defaultValue={prestador?.status ?? 'ativo'}
            className={INPUT}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="suspenso">Suspenso</option>
          </select>
        </div>
      </div>

      {/* Email + Telefone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="p-email" className={LABEL}>
            E-mail
          </label>
          <input
            id="p-email"
            name="email"
            type="email"
            defaultValue={prestador?.email ?? ''}
            placeholder="email@exemplo.com"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="p-tel" className={LABEL}>
            Telefone
          </label>
          <input
            id="p-tel"
            name="telefone"
            defaultValue={prestador?.telefone ?? ''}
            placeholder="(11) 99999-0000"
            className={INPUT}
          />
        </div>
      </div>

      {/* Valor combinado */}
      <div>
        <label htmlFor="p-valor" className={LABEL}>
          Valor combinado (R$/mês)
        </label>
        <input
          id="p-valor"
          name="valor_combinado"
          type="number"
          min={0}
          step="0.01"
          defaultValue={prestador?.valor_combinado ?? ''}
          placeholder="0,00"
          className={INPUT}
        />
      </div>

      {/* Dados bancários */}
      <div className="border-t border-gray-700 pt-4">
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
          Dados bancários / PIX
        </p>
        <div className="space-y-3">
          <div>
            <label htmlFor="p-pix" className={LABEL}>
              Chave PIX
            </label>
            <input
              id="p-pix"
              name="pix"
              defaultValue={prestador?.pix ?? ''}
              placeholder="CPF, CNPJ, e-mail ou telefone"
              className={INPUT}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="p-banco" className={LABEL}>
                Banco
              </label>
              <input
                id="p-banco"
                name="banco"
                defaultValue={prestador?.banco ?? ''}
                placeholder="Ex: Itaú"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="p-ag" className={LABEL}>
                Agência
              </label>
              <input
                id="p-ag"
                name="agencia"
                defaultValue={prestador?.agencia ?? ''}
                placeholder="0000"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="p-conta" className={LABEL}>
                Conta
              </label>
              <input
                id="p-conta"
                name="conta"
                defaultValue={prestador?.conta ?? ''}
                placeholder="00000-0"
                className={INPUT}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div>
        <label htmlFor="p-obs" className={LABEL}>
          Observações
        </label>
        <textarea
          id="p-obs"
          name="observacoes"
          rows={2}
          defaultValue={prestador?.observacoes ?? ''}
          placeholder="Opcional"
          className={`${INPUT} resize-none`}
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
          {isPending
            ? 'Salvando...'
            : prestador
              ? 'Salvar alterações'
              : 'Cadastrar prestador'}
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

// ─── Lançar Pagamento Form ────────────────────────────────────────────────────

function PagarPrestadorForm({
  prestador,
  onSuccess,
  onCancel,
}: {
  prestador: PrestadorComStatus
  onSuccess: () => void
  onCancel: () => void
}) {
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()
  const [tipoPagamento, setTipoPagamento] = useState('')
  const [descricao, setDescricao] = useState(`Pagamento - ${prestador.nome}`)
  const [valorFixo, setValorFixo] = useState<number>(
    prestador.valor_combinado ?? 0
  )
  const [adicional, setAdicional] = useState<number>(0)
  const [motivoAdicional, setMotivoAdicional] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFileName, setPreviewFileName] = useState<string | null>(null)

  const total = valorFixo + adicional

  const action = lancarPagamentoPrestador.bind(null, prestador.id)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const file = e.target.files?.[0]
    if (!file) {
      setPreviewUrl(null)
      setPreviewFileName(null)
      return
    }
    setPreviewFileName(file.name)
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  function handleTipoPagamento(tipo: string) {
    setTipoPagamento(tipo)
    if (tipo && TIPO_PAGAMENTO[tipo]) {
      setDescricao(`${TIPO_PAGAMENTO[tipo]} - ${prestador.nome}`)
    }
    if (tipo === 'adiantamento') {
      setValorFixo(0)
    } else {
      setValorFixo(prestador.valor_combinado ?? 0)
    }
  }

  function handleAction(formData: FormData) {
    setError(undefined)

    if (!tipoPagamento) {
      setError('Selecione o tipo de pagamento.')
      return
    }

    if (total <= 0) {
      setError('O valor total deve ser maior que zero.')
      return
    }

    formData.set('valor', String(total))
    formData.set('valor_fixo', String(valorFixo))
    formData.set('valor_adicional', String(adicional))
    formData.set('tipo_pagamento', tipoPagamento)
    if (adicional > 0 && motivoAdicional.trim()) {
      formData.set('motivo_adicional', motivoAdicional.trim())
    }

    const obsBase = (formData.get('observacoes') as string) || ''
    if (adicional > 0 && motivoAdicional.trim()) {
      const obsExtra = `Adicional: ${motivoAdicional.trim()}`
      formData.set(
        'observacoes',
        [obsExtra, obsBase].filter(Boolean).join('\n')
      )
    }

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
    <form action={handleAction} className="space-y-4">
      {/* Resumo do prestador */}
      <div className="bg-gray-700/50 rounded-lg p-4 space-y-1">
        <p className="text-white font-medium text-sm">{prestador.nome}</p>
        <p className="text-gray-400 text-xs">{prestador.funcao}</p>
        {prestador.pix && (
          <p className="text-gray-400 text-xs">PIX: {prestador.pix}</p>
        )}
      </div>

      {/* Tipo de pagamento */}
      <div>
        <label htmlFor="pp-tipo" className={LABEL}>
          Tipo de pagamento <span className="text-red-400">*</span>
        </label>
        <select
          id="pp-tipo"
          value={tipoPagamento}
          onChange={(e) => handleTipoPagamento(e.target.value)}
          className={INPUT}
        >
          <option value="" disabled>
            Selecione o tipo
          </option>
          {Object.entries(TIPO_PAGAMENTO).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Descrição */}
      <div>
        <label htmlFor="pp-desc" className={LABEL}>
          Descrição <span className="text-red-400">*</span>
        </label>
        <input
          id="pp-desc"
          name="descricao"
          required
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={INPUT}
        />
      </div>

      {/* Valores */}
      <div className="space-y-3">
        {/* Valor fixo / Adiantamento */}
        <div>
          <label htmlFor="pp-fixo" className={LABEL}>
            {tipoPagamento === 'adiantamento'
              ? 'Valor do adiantamento (R$)'
              : 'Valor fixo (R$)'}{' '}
            <span className="text-red-400">*</span>
          </label>
          <input
            id="pp-fixo"
            type="number"
            min={0}
            step="0.01"
            value={valorFixo}
            onChange={(e) =>
              setValorFixo(Math.max(0, Number(e.target.value) || 0))
            }
            className={INPUT}
          />
          {tipoPagamento === 'adiantamento' &&
            prestador.valor_combinado != null && (
              <p className="mt-1.5 text-xs text-yellow-400/90">
                Saldo restante:{' '}
                {fmt(Math.max(0, prestador.valor_combinado - valorFixo))}
              </p>
            )}
        </div>

        {/* Adicional + Motivo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pp-adic" className={LABEL}>
              Adicional (R$)
            </label>
            <input
              id="pp-adic"
              type="number"
              min={0}
              step="0.01"
              value={adicional || ''}
              onChange={(e) => {
                const v = Math.max(0, Number(e.target.value) || 0)
                setAdicional(v)
                if (v === 0) setMotivoAdicional('')
              }}
              placeholder="0,00"
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="pp-motivo" className={LABEL}>
              Motivo do adicional
            </label>
            <input
              id="pp-motivo"
              type="text"
              value={motivoAdicional}
              onChange={(e) => setMotivoAdicional(e.target.value)}
              placeholder="Ex: Bônus, comissão..."
              disabled={adicional === 0}
              className={`${INPUT} disabled:opacity-40 disabled:cursor-not-allowed`}
            />
          </div>
        </div>

        {/* Total calculado */}
        <div className="flex items-center justify-between bg-blue-600/10 border border-blue-600/20 rounded-lg px-4 py-3">
          <div>
            <span className="text-gray-300 text-sm font-medium">
              Total a pagar
            </span>
            {adicional > 0 && (
              <p className="text-gray-500 text-xs mt-0.5">
                {fmt(valorFixo)} + {fmt(adicional)} adicional
              </p>
            )}
          </div>
          <span className="text-white text-xl font-bold">{fmt(total)}</span>
        </div>
      </div>

      {/* Forma de pagamento */}
      <div>
        <label htmlFor="pp-forma" className={LABEL}>
          Forma de pagamento
        </label>
        <select
          id="pp-forma"
          name="forma_pagamento"
          defaultValue={prestador.pix ? 'pix' : ''}
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

      {/* Datas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pp-comp" className={LABEL}>
            Data competência <span className="text-red-400">*</span>
          </label>
          <input
            id="pp-comp"
            name="data_competencia"
            type="date"
            required
            defaultValue={TODAY}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="pp-pgto" className={LABEL}>
            Data pagamento
          </label>
          <input
            id="pp-pgto"
            name="data_pagamento"
            type="date"
            defaultValue={TODAY}
            className={INPUT}
          />
        </div>
      </div>

      {/* Observações */}
      <div>
        <label htmlFor="pp-obs" className={LABEL}>
          Observações
        </label>
        <textarea
          id="pp-obs"
          name="observacoes"
          rows={2}
          placeholder="Opcional"
          className={`${INPUT} resize-none`}
        />
      </div>

      {/* Comprovante */}
      <div>
        <label htmlFor="pp-file" className={LABEL}>
          Comprovante (imagem ou PDF)
        </label>
        <input
          id="pp-file"
          name="comprovante"
          type="file"
          accept="image/jpeg,image/png,image/jpg,.pdf"
          onChange={handleFileChange}
          className={FILE_INPUT}
        />
        {previewUrl && (
          <div className="mt-2 rounded-lg overflow-hidden border border-gray-600 bg-gray-900">
            <img
              src={previewUrl}
              alt="Preview do comprovante"
              className="max-h-40 w-full object-contain"
            />
          </div>
        )}
        {!previewUrl && previewFileName && (
          <div className="mt-2 flex items-center gap-2 text-gray-400 text-xs bg-gray-700/50 rounded-lg px-3 py-2">
            <FileText className="w-4 h-4 shrink-0 text-red-400" />
            <span className="truncate">{previewFileName}</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || total <= 0}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors text-sm"
        >
          {isPending
            ? 'Registrando...'
            : `Registrar ${TIPO_BTN_LABEL[tipoPagamento] ? TIPO_BTN_LABEL[tipoPagamento] + ' ' : ''}${fmt(total)}`}
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
  | { type: 'editar'; prestador: PrestadorComStatus }
  | { type: 'pagar'; prestador: PrestadorComStatus }

interface Props {
  prestadores: PrestadorComStatus[]
}

export default function PrestadoresClient({ prestadores }: Props) {
  const [modal, setModal] = useState<ModalState>({ type: 'closed' })
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'ativo' | 'inativo' | 'suspenso'
  >('todos')
  const [filtroMes, setFiltroMes] = useState<'todos' | 'pago' | 'pendente'>(
    'todos'
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPendingDelete, startDeleteTransition] = useTransition()
  const modalKey = useRef(0)

  function openCriar() {
    modalKey.current += 1
    setModal({ type: 'criar' })
  }

  function openEditar(p: PrestadorComStatus) {
    modalKey.current += 1
    setModal({ type: 'editar', prestador: p })
  }

  function openPagar(p: PrestadorComStatus) {
    modalKey.current += 1
    setModal({ type: 'pagar', prestador: p })
  }

  function closeModal() {
    setModal({ type: 'closed' })
  }

  function handleDelete(id: string, nome: string) {
    if (
      !confirm(
        `Excluir o prestador "${nome}"? Esta ação não pode ser desfeita.`
      )
    )
      return
    setDeletingId(id)
    startDeleteTransition(async () => {
      await excluirPrestador(id)
      setDeletingId(null)
    })
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const ativos = prestadores.filter((p) => p.status === 'ativo')
  const totalValor = ativos.reduce((s, p) => s + (p.valor_combinado ?? 0), 0)
  const pagosMes = ativos.filter((p) => p.status_mes === 'pago').length
  const pendentesMes = ativos.filter((p) => p.status_mes === 'pendente').length

  // ── Filtragem ──────────────────────────────────────────────────────────────

  const filtrados = prestadores.filter((p) => {
    if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false
    if (filtroMes !== 'todos' && p.status_mes !== filtroMes) return false
    return true
  })

  const selectCls =
    'px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-semibold">Prestadores</h2>
          <p className="text-gray-400 text-sm mt-1">
            {ativos.length} ativo{ativos.length !== 1 ? 's' : ''}
            {totalValor > 0 && (
              <span className="text-gray-500">
                {' '}
                · folha {fmt(totalValor)}/mês
              </span>
            )}
          </p>
        </div>

        {/* Resumo do mês */}
        {ativos.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">
                {pagosMes} pago{pagosMes !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">
                {pendentesMes} pendente{pendentesMes !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={openCriar}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Prestador
            </button>
          </div>
        )}

        {ativos.length === 0 && (
          <button
            onClick={openCriar}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Prestador
          </button>
        )}
      </div>

      {/* Filtros */}
      {prestadores.length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <select
            value={filtroStatus}
            onChange={(e) =>
              setFiltroStatus(e.target.value as typeof filtroStatus)
            }
            className={selectCls}
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
            <option value="suspenso">Suspensos</option>
          </select>
          <select
            value={filtroMes}
            onChange={(e) =>
              setFiltroMes(e.target.value as typeof filtroMes)
            }
            className={selectCls}
          >
            <option value="todos">Todos (pagamento do mês)</option>
            <option value="pago">Pagos este mês</option>
            <option value="pendente">Pendentes este mês</option>
          </select>
        </div>
      )}

      {/* Empty state */}
      {prestadores.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
            <UserX className="w-8 h-8 text-gray-600" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium">Nenhum prestador cadastrado</p>
            <p className="text-gray-500 text-sm mt-1">
              Cadastre seu primeiro prestador de serviços
            </p>
          </div>
          <button
            onClick={openCriar}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Cadastrar prestador
          </button>
        </div>
      )}

      {/* Filtrado vazio */}
      {prestadores.length > 0 && filtrados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertCircle className="w-8 h-8 text-gray-600" />
          <p className="text-gray-500 text-sm">
            Nenhum prestador encontrado para os filtros selecionados.
          </p>
        </div>
      )}

      {/* Grid de cards */}
      {filtrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map((p) => {
            const isDeleting = deletingId === p.id
            const statusCfg =
              STATUS_PRESTADOR[p.status] ?? STATUS_PRESTADOR.inativo
            const mesCfg = STATUS_MES[p.status_mes]
            const bankInfo = [
              p.banco,
              p.agencia && `Ag. ${p.agencia}`,
              p.conta && `C. ${p.conta}`,
            ]
              .filter(Boolean)
              .join(' · ')

            return (
              <div
                key={p.id}
                className={`bg-gray-800 rounded-xl border border-gray-700 p-5 flex flex-col gap-4 transition-opacity ${
                  isDeleting ? 'opacity-40' : ''
                }`}
              >
                {/* Cabeçalho do card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold text-base">
                        {p.nome}
                      </h3>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-400">
                        {TIPO_LABEL[p.tipo] ?? p.tipo}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-0.5">{p.funcao}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}
                    >
                      {statusCfg.label}
                    </span>
                    {p.status === 'ativo' && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${mesCfg.cls}`}
                      >
                        {mesCfg.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Informações */}
                <div className="space-y-1.5 text-sm">
                  {p.valor_combinado != null && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="text-white font-medium">
                        {fmt(p.valor_combinado)}
                      </span>
                      <span className="text-gray-500">/mês</span>
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="text-gray-300 truncate">{p.email}</span>
                    </div>
                  )}
                  {p.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="text-gray-300">{p.telefone}</span>
                    </div>
                  )}
                  {p.pix && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 text-xs font-medium text-purple-400 bg-purple-400/15 px-1.5 py-0.5 rounded">
                        PIX
                      </span>
                      <span className="text-gray-300 truncate">{p.pix}</span>
                    </div>
                  )}
                  {bankInfo && (
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="text-gray-300 truncate">{bankInfo}</span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-700 flex-wrap">
                  <button
                    onClick={() => openEditar(p)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  {p.status === 'ativo' && (
                    <button
                      onClick={() => openPagar(p)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-400 bg-gray-700/50 hover:bg-green-400/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Lançar pgto
                    </button>
                  )}
                  <Link
                    href={`/prestadores/${p.id}`}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 bg-gray-700/50 hover:bg-blue-400/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    Histórico
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.nome)}
                    disabled={isPendingDelete}
                    className="ml-auto p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded disabled:opacity-50"
                    title="Excluir prestador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal.type !== 'closed' && (
        <Modal
          key={modalKey.current}
          title={
            modal.type === 'criar'
              ? 'Novo Prestador'
              : modal.type === 'editar'
                ? 'Editar Prestador'
                : `Lançar Pagamento — ${modal.prestador.nome}`
          }
          onClose={closeModal}
        >
          {modal.type === 'criar' || modal.type === 'editar' ? (
            <PrestadorForm
              prestador={modal.type === 'editar' ? modal.prestador : null}
              onSuccess={closeModal}
              onCancel={closeModal}
            />
          ) : (
            <PagarPrestadorForm
              prestador={modal.prestador}
              onSuccess={closeModal}
              onCancel={closeModal}
            />
          )}
        </Modal>
      )}
    </>
  )
}
