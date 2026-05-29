'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { criarCliente, atualizarCliente, excluirCliente } from '@/app/actions/clientes'
import type { Cliente } from '@/types'

type ClienteComCount = Cliente & { contratos_count: number }

const INPUT =
  'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const LABEL = 'block text-sm font-medium text-gray-300 mb-1'

function applyCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  editing: Cliente | null
  onClose: () => void
}

function ClienteModal({ editing, onClose }: ModalProps) {
  const [cpf, setCpf] = useState(editing?.cpf ?? '')
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  function handleAction(formData: FormData) {
    setError(undefined)
    startTransition(async () => {
      const result = editing
        ? await atualizarCliente(editing.id, undefined, formData)
        : await criarCliente(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">
            {editing ? 'Editar cliente' : 'Novo cliente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={handleAction} className="p-6 space-y-4">
          <div>
            <label className={LABEL}>Nome completo *</label>
            <input name="nome" required defaultValue={editing?.nome ?? ''} placeholder="Nome do cliente" className={INPUT} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>CPF *</label>
              <input
                name="cpf" required
                value={cpf}
                onChange={e => setCpf(applyCPF(e.target.value))}
                placeholder="000.000.000-00"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>RG</label>
              <input name="rg" defaultValue={editing?.rg ?? ''} placeholder="RG" className={INPUT} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Data de nascimento</label>
              <input
                name="data_nascimento" type="date"
                defaultValue={editing?.data_nascimento ?? ''}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Telefone</label>
              <input name="telefone" defaultValue={editing?.telefone ?? ''} placeholder="(00) 00000-0000" className={INPUT} />
            </div>
          </div>

          <div>
            <label className={LABEL}>E-mail</label>
            <input name="email" type="email" defaultValue={editing?.email ?? ''} placeholder="email@exemplo.com" className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Endereço</label>
            <input name="endereco" defaultValue={editing?.endereco ?? ''} placeholder="Rua, número, cidade" className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Status</label>
            <select name="status" defaultValue={editing?.status ?? 'ativo'} className={INPUT}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>Observações</label>
            <textarea
              name="observacoes"
              defaultValue={editing?.observacoes ?? ''}
              rows={3}
              placeholder="Observações adicionais..."
              className={INPUT}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors text-sm"
            >
              {isPending ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar cliente'}
            </button>
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  clientes: ClienteComCount[]
}

export default function ClientesClient({ clientes }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [search, setSearch] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf.includes(search)
  )

  function openNew() { setEditing(null); setShowModal(true) }
  function openEdit(c: Cliente) { setEditing(c); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditing(null) }

  function handleRemove(id: string, nome: string) {
    if (!confirm(`Remover o cliente "${nome}"?`)) return
    setRemoving(id)
    startTransition(async () => {
      await excluirCliente(id)
      setRemoving(null)
    })
  }

  return (
    <div className="space-y-5">
      {showModal && <ClienteModal editing={editing} onClose={closeModal} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-xl font-semibold">Clientes</h1>
          <p className="text-gray-400 text-sm mt-0.5">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo cliente
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nome ou CPF..."
        className="w-full max-w-sm px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-900">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">CPF</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Telefone</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">E-mail</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Contratos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-500">
                  {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/clientes/${c.id}`)}
                  className={`border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors ${removing === c.id ? 'opacity-40' : ''}`}
                >
                  <td className="px-4 py-3 text-white font-medium">{c.nome}</td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">{c.cpf}</td>
                  <td className="px-4 py-3 text-gray-300 hidden sm:table-cell">{c.telefone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-300 hidden md:table-cell">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === 'ativo' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">{c.contratos_count}</td>
                  <td
                    className="px-4 py-3"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors rounded"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(c.id, c.nome)}
                        disabled={isPending}
                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded disabled:opacity-50"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
