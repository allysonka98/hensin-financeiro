'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, X, FileText } from 'lucide-react'
import {
  criarContrato,
  atualizarContrato,
  excluirContrato,
} from '@/app/actions/contratos'
import type { ContratoComPrestador } from '../page'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPOS_ACAO = ['GIFA', 'GDAT', 'RAV 8x', 'Outros']

const STATUS_CONFIG: Record<
  string,
  { label: string; cls: string }
> = {
  ativo: { label: 'Ativo', cls: 'bg-green-400/15 text-green-400' },
  encerrado: { label: 'Encerrado', cls: 'bg-gray-600/40 text-gray-400' },
  suspenso: { label: 'Suspenso', cls: 'bg-yellow-400/15 text-yellow-400' },
  em_negociacao: {
    label: 'Em negociação',
    cls: 'bg-blue-400/15 text-blue-400',
  },
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

const TODAY = new Date().toISOString().split('T')[0]

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT =
  'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const LABEL = 'block text-sm font-medium text-gray-300 mb-1'

// ─── Modal ────────────────────────────────────────────────────────────────────

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

// ─── Contrato Form ────────────────────────────────────────────────────────────

function ContratoForm({
  contrato,
  prestadores,
  onSuccess,
  onCancel,
}: {
  contrato?: ContratoComPrestador | null
  prestadores: { id: string; nome: string }[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  const serverAction = contrato
    ? atualizarContrato.bind(null, contrato.id)
    : criarContrato

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
      {/* Cliente */}
      <div>
        <label htmlFor="c-cliente" className={LABEL}>
          Cliente <span className="text-red-400">*</span>
        </label>
        <input
          id="c-cliente"
          name="cliente_nome"
          required
          defaultValue={contrato?.cliente_nome ?? ''}
          placeholder="Nome do cliente"
          className={INPUT}
        />
      </div>

      {/* Descrição */}
      <div>
        <label htmlFor="c-desc" className={LABEL}>
          Descrição <span className="text-red-400">*</span>
        </label>
        <input
          id="c-desc"
          name="descricao"
          required
          defaultValue={contrato?.descricao ?? ''}
          placeholder="Ex: Recuperação de precatório FGTS"
          className={INPUT}
        />
      </div>

      {/* Tipo de ação + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="c-tipo" className={LABEL}>
            Tipo de ação <span className="text-red-400">*</span>
          </label>
          <select
            id="c-tipo"
            name="tipo_acao"
            required
            defaultValue={contrato?.tipo_acao ?? ''}
            className={INPUT}
          >
            <option value="" disabled>
              Selecione
            </option>
            {TIPOS_ACAO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-status" className={LABEL}>
            Status <span className="text-red-400">*</span>
          </label>
          <select
            id="c-status"
            name="status"
            required
            defaultValue={contrato?.status ?? 'ativo'}
            className={INPUT}
          >
            <option value="ativo">Ativo</option>
            <option value="em_negociacao">Em negociação</option>
            <option value="suspenso">Suspenso</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
      </div>

      {/* Valor + Honorários */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="c-valor" className={LABEL}>
            Valor do contrato (R$) <span className="text-red-400">*</span>
          </label>
          <input
            id="c-valor"
            name="valor"
            type="number"
            required
            min={0}
            step="0.01"
            defaultValue={contrato?.valor ?? ''}
            placeholder="0,00"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="c-hon" className={LABEL}>
            Honorários (R$) <span className="text-red-400">*</span>
          </label>
          <input
            id="c-hon"
            name="honorarios"
            type="number"
            required
            min={0}
            step="0.01"
            defaultValue={contrato?.honorarios ?? ''}
            placeholder="0,00"
            className={INPUT}
          />
        </div>
      </div>

      {/* Data assinatura + Prestador responsável */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="c-data" className={LABEL}>
            Data assinatura <span className="text-red-400">*</span>
          </label>
          <input
            id="c-data"
            name="data_assinatura"
            type="date"
            required
            defaultValue={contrato?.data_assinatura ?? TODAY}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="c-prest" className={LABEL}>
            Prestador responsável
          </label>
          <select
            id="c-prest"
            name="prestador_responsavel_id"
            defaultValue={contrato?.prestador_responsavel_id ?? ''}
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
            : contrato
              ? 'Salvar alterações'
              : 'Criar contrato'}
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
  | { type: 'editar'; contrato: ContratoComPrestador }

interface Props {
  contratos: ContratoComPrestador[]
  prestadores: { id: string; nome: string }[]
}

export default function ContratosClient({ contratos, prestadores }: Props) {
  const [modal, setModal] = useState<ModalState>({ type: 'closed' })
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPendingDelete, startDeleteTransition] = useTransition()
  const modalKey = useRef(0)

  function openCriar() {
    modalKey.current += 1
    setModal({ type: 'criar' })
  }

  function openEditar(c: ContratoComPrestador) {
    modalKey.current += 1
    setModal({ type: 'editar', contrato: c })
  }

  function closeModal() {
    setModal({ type: 'closed' })
  }

  function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o contrato de "${nome}"? Esta ação não pode ser desfeita.`))
      return
    setDeletingId(id)
    startDeleteTransition(async () => {
      await excluirContrato(id)
      setDeletingId(null)
    })
  }

  const filtrados = contratos.filter((c) => {
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false
    if (filtroTipo !== 'todos' && c.tipo_acao !== filtroTipo) return false
    return true
  })

  const totalValor = filtrados.reduce((s, c) => s + c.valor, 0)
  const totalHonorarios = filtrados.reduce((s, c) => s + c.honorarios, 0)

  const selectCls =
    'px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-xl font-semibold">Contratos</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {contratos.length} contrato{contratos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCriar}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Contrato
        </button>
      </div>

      {/* Filtros */}
      {contratos.length > 0 && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={selectCls}
          >
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className={selectCls}
          >
            <option value="todos">Todos os tipos</option>
            {TIPOS_ACAO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {contratos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
              <FileText className="w-7 h-7 text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Nenhum contrato cadastrado</p>
              <p className="text-gray-500 text-sm mt-1">
                Cadastre o primeiro contrato do escritório
              </p>
            </div>
            <button
              onClick={openCriar}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Contrato
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  {[
                    'Cliente',
                    'Tipo',
                    'Valor',
                    'Honorários',
                    'Assinatura',
                    'Responsável',
                    'Status',
                    '',
                  ].map((h, i) => (
                    <th
                      key={i}
                      className={`text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 ${
                        i === 2 || i === 3
                          ? 'text-right'
                          : i === 6
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
                      colSpan={8}
                      className="text-center text-gray-500 py-10 text-sm"
                    >
                      Nenhum contrato encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((c) => {
                    const statusCfg =
                      STATUS_CONFIG[c.status] ?? STATUS_CONFIG.encerrado
                    const isDeleting = deletingId === c.id

                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-gray-750 transition-colors ${isDeleting ? 'opacity-40' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-white text-sm font-medium">
                            {c.cliente_nome ?? '—'}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[180px]">
                            {c.descricao}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm">
                          {c.tipo_acao}
                        </td>
                        <td className="px-4 py-3 text-right text-white text-sm font-medium whitespace-nowrap">
                          {fmt(c.valor)}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-400 text-sm font-medium whitespace-nowrap">
                          {fmt(c.honorarios)}
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">
                          {fmtDate(c.data_assinatura)}
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm">
                          {c.prestador_responsavel?.nome ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEditar(c)}
                              className="p-1.5 text-gray-400 hover:text-white transition-colors rounded"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(c.id, c.cliente_nome ?? 'cliente')
                              }
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

              {filtrados.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-600 bg-gray-700/40">
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-gray-400 text-sm font-medium"
                    >
                      Totais ({filtrados.length} contratos)
                    </td>
                    <td className="px-4 py-3 text-right text-white text-sm font-semibold whitespace-nowrap">
                      {fmt(totalValor)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-400 text-sm font-semibold whitespace-nowrap">
                      {fmt(totalHonorarios)}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.type !== 'closed' && (
        <Modal
          key={modalKey.current}
          title={modal.type === 'criar' ? 'Novo Contrato' : 'Editar Contrato'}
          onClose={closeModal}
        >
          <ContratoForm
            contrato={modal.type === 'editar' ? modal.contrato : null}
            prestadores={prestadores}
            onSuccess={closeModal}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  )
}
