'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, X, History } from 'lucide-react'
import {
  criarContaFixa,
  atualizarContaFixa,
  excluirContaFixa,
} from '@/app/actions/contas-fixas'
import type { ContaFixaComStatus } from '../page'
import type { ContaFixa } from '@/types'

// ─── Labels ──────────────────────────────────────────────────────────────────

const CATEGORIAS: Record<string, string> = {
  aluguel: 'Aluguel',
  internet: 'Internet',
  telefonia: 'Telefonia',
  energia: 'Energia Elétrica',
  agua: 'Água',
  software: 'Software/Serviços',
  contabilidade: 'Contabilidade',
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

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const STATUS_CONFIG = {
  paga: { label: 'Paga', className: 'bg-green-400/15 text-green-400' },
  pendente: { label: 'Pendente', className: 'bg-yellow-400/15 text-yellow-400' },
  vencida: { label: 'Vencida', className: 'bg-red-400/15 text-red-400' },
  inativa: { label: 'Inativa', className: 'bg-gray-600/40 text-gray-400' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)
}

// ─── Form ────────────────────────────────────────────────────────────────────

interface ContaFixaFormProps {
  conta?: ContaFixa
  onSuccess: () => void
  onCancel: () => void
}

function ContaFixaForm({ conta, onSuccess, onCancel }: ContaFixaFormProps) {
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  const serverAction = conta
    ? atualizarContaFixa.bind(null, conta.id)
    : criarContaFixa

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

  const inputCls =
    'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1'

  return (
    <form action={handleAction} className="space-y-4">
      {/* Nome */}
      <div>
        <label htmlFor="cf-nome" className={labelCls}>
          Nome <span className="text-red-400">*</span>
        </label>
        <input
          id="cf-nome"
          name="nome"
          required
          defaultValue={conta?.nome}
          placeholder="Ex: Aluguel escritório"
          className={inputCls}
        />
      </div>

      {/* Categoria */}
      <div>
        <label htmlFor="cf-categoria" className={labelCls}>
          Categoria <span className="text-red-400">*</span>
        </label>
        <select
          id="cf-categoria"
          name="categoria"
          required
          defaultValue={conta?.categoria ?? ''}
          className={inputCls}
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

      {/* Vencimento */}
      <div className={`grid gap-3 ${conta ? 'grid-cols-1' : 'grid-cols-3'}`}>
        <div>
          <label htmlFor="cf-dia" className={labelCls}>
            Dia vencimento <span className="text-red-400">*</span>
          </label>
          <input
            id="cf-dia"
            name="dia_vencimento"
            type="number"
            required
            min={1}
            max={31}
            defaultValue={conta?.dia_vencimento}
            placeholder="Ex: 10"
            className={inputCls}
          />
        </div>

        {!conta && (
          <>
            <div>
              <label htmlFor="cf-mes" className={labelCls}>
                Mês <span className="text-red-400">*</span>
              </label>
              <select
                id="cf-mes"
                name="mes_vencimento"
                required
                defaultValue={new Date().getMonth() + 1}
                className={inputCls}
              >
                {MESES.map((nome, i) => (
                  <option key={i + 1} value={i + 1}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cf-ano" className={labelCls}>
                Ano <span className="text-red-400">*</span>
              </label>
              <input
                id="cf-ano"
                name="ano_vencimento"
                type="number"
                required
                min={2000}
                max={2100}
                defaultValue={new Date().getFullYear()}
                className={inputCls}
              />
            </div>
          </>
        )}
      </div>

      {/* Valor + Forma pgto */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cf-valor" className={labelCls}>
            Valor estimado (R$) <span className="text-red-400">*</span>
          </label>
          <input
            id="cf-valor"
            name="valor_estimado"
            type="number"
            required
            min={0}
            step="0.01"
            defaultValue={conta?.valor_estimado}
            placeholder="0,00"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="cf-forma" className={labelCls}>
            Forma de pagamento <span className="text-red-400">*</span>
          </label>
          <select
            id="cf-forma"
            name="forma_pagamento"
            required
            defaultValue={conta?.forma_pagamento ?? ''}
            className={inputCls}
          >
            <option value="" disabled>
              Selecione
            </option>
            {Object.entries(FORMAS_PAGAMENTO).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fornecedor */}
      <div>
        <label htmlFor="cf-fornecedor" className={labelCls}>
          Fornecedor
        </label>
        <input
          id="cf-fornecedor"
          name="fornecedor"
          defaultValue={conta?.fornecedor ?? ''}
          placeholder="Nome do fornecedor"
          className={inputCls}
        />
      </div>

      {/* Observações */}
      <div>
        <label htmlFor="cf-obs" className={labelCls}>
          Observações
        </label>
        <textarea
          id="cf-obs"
          name="observacoes"
          rows={2}
          defaultValue={conta?.observacoes ?? ''}
          placeholder="Observações opcionais"
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Checkboxes */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            name="recorrente"
            defaultChecked={conta?.recorrente ?? true}
            className="w-4 h-4 rounded accent-blue-500"
          />
          Recorrente
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            name="ativa"
            defaultChecked={conta?.ativa ?? true}
            className="w-4 h-4 rounded accent-blue-500"
          />
          Ativa
        </label>
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
          {isPending ? 'Salvando...' : conta ? 'Salvar alterações' : 'Criar conta'}
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

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
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

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  contas: ContaFixaComStatus[]
}

type ModalState =
  | { type: 'closed' }
  | { type: 'criar' }
  | { type: 'editar'; conta: ContaFixa }

export default function ContasFixasClient({ contas }: Props) {
  const [modal, setModal] = useState<ModalState>({ type: 'closed' })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const modalKey = useRef(0)

  function openCriar() {
    modalKey.current += 1
    setModal({ type: 'criar' })
  }

  function openEditar(conta: ContaFixa) {
    modalKey.current += 1
    setModal({ type: 'editar', conta })
  }

  function closeModal() {
    setModal({ type: 'closed' })
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir esta conta fixa? Esta ação não pode ser desfeita.'))
      return
    setDeletingId(id)
    startTransition(async () => {
      await excluirContaFixa(id)
      setDeletingId(null)
    })
  }

  const totalAtivas = contas
    .filter((c) => c.ativa)
    .reduce((sum, c) => sum + c.valor_estimado, 0)

  return (
    <>
      {/* Header da página */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-400 text-sm mt-0.5">
            {contas.filter((c) => c.ativa).length} contas ativas •{' '}
            {formatCurrency(totalAtivas)}/mês
          </p>
        </div>
        <button
          onClick={openCriar}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Conta
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Nome
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Categoria
                </th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Valor
                </th>
                <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Vencimento
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Forma Pgto
                </th>
                <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {contas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-gray-500 py-12 text-sm"
                  >
                    Nenhuma conta cadastrada. Clique em &quot;Nova Conta&quot; para começar.
                  </td>
                </tr>
              ) : (
                contas.map((conta) => {
                  const statusCfg = STATUS_CONFIG[conta.status_mes]
                  const isDeleting = deletingId === conta.id

                  return (
                    <tr
                      key={conta.id}
                      className={`hover:bg-gray-750 transition-colors ${isDeleting ? 'opacity-40' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-white text-sm font-medium">
                          {conta.nome}
                        </span>
                        {conta.fornecedor && (
                          <p className="text-gray-500 text-xs mt-0.5">
                            {conta.fornecedor}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {CATEGORIAS[conta.categoria] ?? conta.categoria}
                      </td>
                      <td className="px-4 py-3 text-right text-white text-sm font-medium">
                        {formatCurrency(conta.valor_estimado)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300 text-sm">
                        Dia {conta.dia_vencimento}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {FORMAS_PAGAMENTO[conta.forma_pagamento] ??
                          conta.forma_pagamento}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Link
                            href={`/contas-fixas/${conta.id}`}
                            className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors rounded"
                            title="Ver histórico"
                          >
                            <History className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openEditar(conta)}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(conta.id)}
                            disabled={isPending}
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

            {/* Totalizador */}
            {contas.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-600 bg-gray-700/40">
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-gray-400 text-sm font-medium"
                  >
                    Total contas ativas
                  </td>
                  <td className="px-4 py-3 text-right text-white font-bold text-sm">
                    {formatCurrency(totalAtivas)}
                  </td>
                  <td colSpan={4} />
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
          title={modal.type === 'criar' ? 'Nova Conta Fixa' : 'Editar Conta Fixa'}
          onClose={closeModal}
        >
          <ContaFixaForm
            conta={modal.type === 'editar' ? modal.conta : undefined}
            onSuccess={closeModal}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  )
}
