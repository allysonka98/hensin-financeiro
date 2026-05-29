'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, CheckCircle2, UserRound } from 'lucide-react'
import {
  salvarDadosEscritorio,
  adicionarCategoria,
  removerCategoria,
  alterarSenha,
} from '@/app/actions/configuracoes'
import type { Configuracao, CategoriaDespesa } from '@/types'
import type { UsuarioSistema } from '../page'

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT =
  'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const LABEL = 'block text-sm font-medium text-gray-300 mb-1'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h3 className="text-white font-semibold text-base mb-5">{title}</h3>
      {children}
    </div>
  )
}

function Feedback({ error, success }: { error?: string; success?: string }) {
  if (error)
    return (
      <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
        {error}
      </p>
    )
  if (success)
    return (
      <p className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-2 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        {success}
      </p>
    )
  return null
}

// ─── CNPJ mask ────────────────────────────────────────────────────────────────

function applyCNPJ(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

// ─── Dados do escritório ──────────────────────────────────────────────────────

function EscritorioForm({ config }: { config: Configuracao }) {
  const [state, setState] = useState<{ error?: string; success?: string } | undefined>()
  const [isPending, startTransition] = useTransition()
  const [cnpj, setCnpj] = useState(config.cnpj ?? '')

  function handleAction(formData: FormData) {
    setState(undefined)
    startTransition(async () => {
      const result = await salvarDadosEscritorio(undefined, formData)
      setState(result)
    })
  }

  return (
    <form action={handleAction} className="space-y-4">
      <div>
        <label htmlFor="e-nome" className={LABEL}>Nome do escritório</label>
        <input
          id="e-nome" name="nome_escritorio"
          defaultValue={config.nome_escritorio}
          placeholder="Ex: Hensin Advocacia"
          className={INPUT}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="e-cnpj" className={LABEL}>CNPJ</label>
          <input
            id="e-cnpj" name="cnpj"
            value={cnpj}
            onChange={e => setCnpj(applyCNPJ(e.target.value))}
            placeholder="00.000.000/0000-00"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="e-end" className={LABEL}>Endereço</label>
          <input
            id="e-end" name="endereco"
            defaultValue={config.endereco}
            placeholder="Rua, número, cidade"
            className={INPUT}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="e-tel" className={LABEL}>Telefone</label>
          <input
            id="e-tel" name="telefone"
            defaultValue={config.telefone ?? ''}
            placeholder="(00) 00000-0000"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="e-email" className={LABEL}>E-mail</label>
          <input
            id="e-email" name="email" type="email"
            defaultValue={config.email ?? ''}
            placeholder="contato@escritorio.com"
            className={INPUT}
          />
        </div>
      </div>

      <Feedback error={state?.error} success={state?.success} />

      <button
        type="submit" disabled={isPending}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition-colors text-sm"
      >
        {isPending ? 'Salvando...' : 'Salvar dados'}
      </button>
    </form>
  )
}

// ─── Usuários do sistema ──────────────────────────────────────────────────────

function UsuariosSection({ usuarios }: { usuarios: UsuarioSistema[] }) {
  if (usuarios.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        Nenhum usuário encontrado. Configure{' '}
        <code className="bg-gray-700 px-1 rounded text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
        para listar usuários.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-gray-700/50">
      {usuarios.map(u => (
        <li key={u.id} className="flex items-center gap-3 py-3">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
            <UserRound className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{u.email}</p>
            <p className="text-gray-500 text-xs">
              Cadastrado em{' '}
              {new Date(u.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ─── Categorias de despesa ────────────────────────────────────────────────────

const CATEGORIAS_PADRAO = [
  'Honorários', 'Prestador', 'Conta Fixa', 'Imposto', 'Escritório', 'Marketing', 'Outros',
]

function CategoriasForm({ categorias }: { categorias: CategoriaDespesa[] }) {
  const [addState, setAddState] = useState<{ error?: string; success?: string } | undefined>()
  const [isPendingAdd, startAddTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isPendingRemove, startRemoveTransition] = useTransition()

  function handleAdd(formData: FormData) {
    setAddState(undefined)
    startAddTransition(async () => {
      const result = await adicionarCategoria(undefined, formData)
      setAddState(result)
    })
  }

  function handleRemove(id: string) {
    if (!confirm('Remover esta categoria?')) return
    setRemovingId(id)
    startRemoveTransition(async () => {
      await removerCategoria(id)
      setRemovingId(null)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Categorias padrão (não editáveis)</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_PADRAO.map(c => (
            <span key={c} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-400">
              {c}
            </span>
          ))}
        </div>
      </div>

      {categorias.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Categorias personalizadas</p>
          <div className="space-y-1.5">
            {categorias.map(cat => (
              <div
                key={cat.id}
                className={`flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-2 transition-opacity ${removingId === cat.id ? 'opacity-40' : ''}`}
              >
                <span className="text-gray-200 text-sm">{cat.nome}</span>
                <button
                  onClick={() => handleRemove(cat.id)}
                  disabled={isPendingRemove}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors rounded disabled:opacity-50"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form action={handleAdd} className="flex gap-3">
        <input
          name="nome" placeholder="Nova categoria..."
          className={`${INPUT} flex-1`} required
        />
        <button
          type="submit" disabled={isPendingAdd}
          className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </form>

      <Feedback error={addState?.error} success={addState?.success} />
    </div>
  )
}

// ─── Alterar senha ────────────────────────────────────────────────────────────

function SenhaForm() {
  const [state, setState] = useState<{ error?: string; success?: string } | undefined>()
  const [isPending, startTransition] = useTransition()

  function handleAction(formData: FormData) {
    setState(undefined)
    startTransition(async () => {
      const result = await alterarSenha(undefined, formData)
      setState(result)
    })
  }

  return (
    <form action={handleAction} className="space-y-4 max-w-sm">
      <div>
        <label htmlFor="s-atual" className={LABEL}>
          Senha atual <span className="text-red-400">*</span>
        </label>
        <input
          id="s-atual" name="senha_atual" type="password" required
          placeholder="Sua senha atual"
          className={INPUT} autoComplete="current-password"
        />
      </div>
      <div>
        <label htmlFor="s-nova" className={LABEL}>
          Nova senha <span className="text-red-400">*</span>
        </label>
        <input
          id="s-nova" name="nova_senha" type="password" required
          placeholder="Mínimo 6 caracteres"
          className={INPUT} autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="s-conf" className={LABEL}>
          Confirmar nova senha <span className="text-red-400">*</span>
        </label>
        <input
          id="s-conf" name="confirmar_senha" type="password" required
          placeholder="Repita a senha"
          className={INPUT} autoComplete="new-password"
        />
      </div>

      <Feedback error={state?.error} success={state?.success} />

      <button
        type="submit" disabled={isPending}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition-colors text-sm"
      >
        {isPending ? 'Alterando...' : 'Alterar senha'}
      </button>
    </form>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  config: Configuracao
  categorias: CategoriaDespesa[]
  usuarios: UsuarioSistema[]
}

export default function ConfiguracoesClient({ config, categorias, usuarios }: Props) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="mb-2">
        <h2 className="text-white text-xl font-semibold">Configurações</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Dados do escritório, usuários, categorias e segurança da conta.
        </p>
      </div>

      <Section title="Dados do escritório">
        <EscritorioForm config={config} />
      </Section>

      <Section title="Usuários do sistema">
        <UsuariosSection usuarios={usuarios} />
      </Section>

      <Section title="Categorias de despesa">
        <CategoriasForm categorias={categorias} />
      </Section>

      <Section title="Segurança — alterar senha">
        <SenhaForm />
      </Section>
    </div>
  )
}
