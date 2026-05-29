import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

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

const STATUS_CONFIG = {
  pago: {
    label: 'Pago',
    icon: CheckCircle2,
    className: 'text-green-400',
    bg: 'bg-green-400/15',
  },
  pendente: {
    label: 'Pendente',
    icon: Clock,
    className: 'text-yellow-400',
    bg: 'bg-yellow-400/15',
  },
  cancelado: {
    label: 'Cancelado',
    icon: XCircle,
    className: 'text-red-400',
    bg: 'bg-red-400/15',
  },
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default async function ContaFixaHistoricoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: conta }, { data: lancamentos }] = await Promise.all([
    supabase.from('contas_fixas').select('*').eq('id', id).single(),
    supabase
      .from('lancamentos')
      .select('*')
      .eq('conta_fixa_id', id)
      .order('data_competencia', { ascending: false }),
  ])

  if (!conta) notFound()

  const totalPago = (lancamentos ?? [])
    .filter((l) => l.status === 'pago')
    .reduce((sum, l) => sum + l.valor, 0)

  return (
    <div className="max-w-3xl space-y-6">
      {/* Voltar */}
      <Link
        href="/contas-fixas"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Contas Fixas
      </Link>

      {/* Card de detalhes da conta */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-white text-lg font-semibold">{conta.nome}</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {CATEGORIAS[conta.categoria] ?? conta.categoria}
              {conta.fornecedor ? ` • ${conta.fornecedor}` : ''}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              conta.ativa
                ? 'bg-green-400/15 text-green-400'
                : 'bg-gray-600/40 text-gray-400'
            }`}
          >
            {conta.ativa ? 'Ativa' : 'Inativa'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
          <div>
            <p className="text-gray-500 text-xs">Valor estimado</p>
            <p className="text-white font-medium text-sm mt-0.5">
              {formatCurrency(conta.valor_estimado)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Vencimento</p>
            <p className="text-white font-medium text-sm mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Dia {conta.dia_vencimento}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Forma de pagamento</p>
            <p className="text-white font-medium text-sm mt-0.5">
              {FORMAS_PAGAMENTO[conta.forma_pagamento] ?? conta.forma_pagamento}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Total pago (histórico)</p>
            <p className="text-green-400 font-medium text-sm mt-0.5">
              {formatCurrency(totalPago)}
            </p>
          </div>
        </div>

        {conta.observacoes && (
          <p className="text-gray-400 text-sm mt-4 pt-4 border-t border-gray-700">
            {conta.observacoes}
          </p>
        )}
      </div>

      {/* Histórico de lançamentos */}
      <div>
        <h3 className="text-white font-semibold mb-3">
          Histórico de pagamentos
          <span className="text-gray-500 font-normal text-sm ml-2">
            ({lancamentos?.length ?? 0} registros)
          </span>
        </h3>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {!lancamentos || lancamentos.length === 0 ? (
            <p className="text-center text-gray-500 py-12 text-sm">
              Nenhum lançamento vinculado a esta conta.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                    Competência
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                    Descrição
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                    Valor
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                    Pgto
                  </th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {lancamentos.map((l) => {
                  const cfg =
                    STATUS_CONFIG[l.status as keyof typeof STATUS_CONFIG]
                  const Icon = cfg?.icon ?? Clock

                  return (
                    <tr key={l.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {formatDate(l.data_competencia)}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {l.descricao}
                      </td>
                      <td className="px-4 py-3 text-right text-white text-sm font-medium">
                        {formatCurrency(l.valor)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {l.data_pagamento ? formatDate(l.data_pagamento) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg?.bg ?? ''} ${cfg?.className ?? 'text-gray-400'}`}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg?.label ?? l.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
