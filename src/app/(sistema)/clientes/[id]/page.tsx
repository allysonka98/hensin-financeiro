import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'
import type { Cliente, Contrato } from '@/types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const STATUS_CONTRATO: Record<string, { label: string; cls: string }> = {
  ativo:          { label: 'Ativo',          cls: 'bg-green-900 text-green-300' },
  encerrado:      { label: 'Encerrado',      cls: 'bg-gray-700 text-gray-400' },
  suspenso:       { label: 'Suspenso',       cls: 'bg-yellow-900 text-yellow-300' },
  em_negociacao:  { label: 'Em negociação',  cls: 'bg-blue-900 text-blue-300' },
}

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: cliente }, { data: contratos }] = await Promise.all([
    supabase.from('clientes').select('*').eq('id', id).single(),
    supabase.from('contratos').select('*').eq('cliente_id', id).order('data_assinatura', { ascending: false }),
  ])

  if (!cliente) notFound()

  const c = cliente as Cliente
  const lista = (contratos ?? []) as Contrato[]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para clientes
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">{c.nome}</h1>
            <p className="text-gray-400 text-sm mt-0.5">CPF: {c.cpf}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.status === 'ativo' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
            {c.status}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide text-gray-400">Dados pessoais</h2>
          {[
            ['RG', c.rg],
            ['Data de nascimento', c.data_nascimento ? new Date(c.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : null],
            ['Telefone', c.telefone],
            ['E-mail', c.email],
            ['Endereço', c.endereco],
          ].map(([label, value]) =>
            value ? (
              <div key={label as string}>
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="text-white text-sm">{value}</p>
              </div>
            ) : null
          )}
        </div>

        {c.observacoes && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wide mb-3">Observações</h2>
            <p className="text-gray-300 text-sm whitespace-pre-line">{c.observacoes}</p>
          </div>
        )}
      </div>

      {/* Contratos */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <h2 className="text-white font-semibold text-sm">
            Contratos vinculados
            <span className="ml-2 text-gray-500 font-normal">({lista.length})</span>
          </h2>
        </div>

        {lista.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            Nenhum contrato vinculado a este cliente.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Descrição</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Tipo de ação</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Valor</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Honorários</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Assinatura</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(ct => {
                const s = STATUS_CONTRATO[ct.status] ?? { label: ct.status, cls: 'bg-gray-700 text-gray-400' }
                return (
                  <tr key={ct.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="px-4 py-3 text-white">{ct.descricao}</td>
                    <td className="px-4 py-3 text-gray-300 hidden sm:table-cell capitalize">{ct.tipo_acao}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">{fmt(ct.valor)}</td>
                    <td className="px-4 py-3 text-right text-blue-400 hidden md:table-cell">{fmt(ct.honorarios)}</td>
                    <td className="px-4 py-3 text-gray-300">{new Date(ct.data_assinatura + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>{s.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
