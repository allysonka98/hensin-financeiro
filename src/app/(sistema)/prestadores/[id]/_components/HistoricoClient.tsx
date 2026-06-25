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

const STATUS_CONFIG: Record<
  string,
  {
    label: string
    cls: string
    icon: React.ReactNode
  }
> = {
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

  return new Date(
    Number(y),
    Number(m) - 1,
    1
  ).toLocaleDateString('pt-BR', {
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

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  })

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

  const hLine = (yy: number) => {
    doc.line(L, yy, R, yy)
  }

  // Header

  setBold(18)

  doc.setTextColor(30, 30, 30)

  doc.text(
    'HENSIN ADVOGADOS',
    PW / 2,
    y,
    {
      align: 'center',
    }
  )

  y += 7

  setNormal(10)

  doc.setTextColor(80, 80, 80)

  doc.text(
    'RECIBO DE PAGAMENTO DE SERVICOS',
    PW / 2,
    y,
    {
      align: 'center',
    }
  )

  y += 7

  doc.setDrawColor(180, 180, 180)

  hLine(y)

  y += 5

  const reciboNum =
    `REC-${
      lancamento.data_competencia
        .substring(0, 7)
        .replace('-', '/')
    }-${
      lancamento.id
        .substring(0, 8)
        .toUpperCase()
    }`

  setNormal(8)

  doc.setTextColor(100, 100, 100)

  doc.text(
    `No: ${reciboNum}`,
    L,
    y
  )

  doc.text(
    `Data: ${fmtDate(lancamento.data_competencia)}`,
    PW / 2,
    y,
    {
      align: 'center',
    }
  )

  doc.text(
    'Local: Guarulhos, SP',
    R,
    y,
    {
      align: 'right',
    }
  )

  y += 8  // Corpo

  setBold(12)

  doc.setTextColor(0, 0, 0)

  doc.text(
    'Recebi da empresa Hensin Advogados',
    L,
    y
  )

  y += 8

  setNormal(11)

  const texto = `
Eu, ${prestador.nome}, inscrito(a) sob CPF/CNPJ ${prestador.cpf_cnpj},
declaro que recebi o valor de ${fmt(Number(lancamento.valor))},
referente ao pagamento de servicos prestados.

Competencia: ${fmtMesAno(lancamento.data_competencia)}

Forma de pagamento:
${
  FORMAS_PAGAMENTO_LABEL[
    lancamento.forma_pagamento
  ] ??
  lancamento.forma_pagamento
}

Tipo:
${
  TIPO_PAGAMENTO[
    lancamento.tipo_pagamento
  ] ??
  lancamento.tipo_pagamento
}
`

  const split = doc.splitTextToSize(
    texto,
    165
  )

  doc.text(
    split,
    L,
    y
  )

  y += split.length * 7

  y += 10

  hLine(y)

  y += 10

  setBold(10)

  doc.text(
    'Resumo',
    L,
    y
  )

  y += 7

  setNormal(10)

  doc.text(
    `Prestador: ${prestador.nome}`,
    L,
    y
  )

  y += 7

  doc.text(
    `Valor pago: ${fmt(Number(lancamento.valor))}`,
    L,
    y
  )

  y += 7

  doc.text(
    `Data: ${fmtDate(lancamento.data_competencia)}`,
    L,
    y
  )

  y += 20

  hLine(y)

  y += 18

  doc.text(
    prestador.nome,
    PW / 2,
    y,
    {
      align: 'center',
    }
  )

  y += 6

  doc.text(
    prestador.cpf_cnpj,
    PW / 2,
    y,
    {
      align: 'center',
    }
  )

  return doc.output('blob')
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  prestador: Prestador
  historico: Lancamento[]
}

export default function HistoricoClient({
  prestador,
  historico,
}: Props) {
  const [loadingId, setLoadingId] =
    useState<string | null>(
      null
    )

  async function gerarRecibo(
    lancamento: Lancamento
  ) {
    try {
      setLoadingId(
        lancamento.id
      )

      const pdf =
        await generateReciboPDF(
          lancamento,
          prestador
        )

      const base64 =
        arrayBufferToBase64(
          await pdf.arrayBuffer()
        )

      const res =
        await salvarRecibo(
          lancamento.id,
          base64
        )

      if (
        res?.url
      ) {
        window.open(
          res.url,
          '_blank'
        )
      }
    } finally {
      setLoadingId(
        null
      )
    }
  }

  const total =
    historico.reduce(
      (
        acc,
        item
      ) =>
        acc +
        Number(
          item.valor
        ),
      0
    )  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/prestadores"
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            text-zinc-400
            hover:text-white
          "
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div
          className="
            rounded-xl
            border
            border-zinc-800
            bg-zinc-900
            px-4
            py-2
          "
        >
          <div className="text-xs text-zinc-400">
            Total pago
          </div>

          <div
            className="
              text-lg
              font-semibold
            "
          >
            {fmt(total)}
          </div>
        </div>
      </div>

      <div
        className="
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-950
          p-6
        "
      >
        <div className="flex gap-4">
          <div
            className="
              h-14
              w-14
              rounded-full
              bg-cyan-500/15
              flex
              items-center
              justify-center
            "
          >
            <Building2
              className="
                w-7
                h-7
                text-cyan-400
              "
            />
          </div>

          <div className="flex-1">
            <h1
              className="
                text-2xl
                font-bold
              "
            >
              {prestador.nome}
            </h1>

            <div
              className="
                mt-2
                flex
                flex-wrap
                gap-4
                text-sm
                text-zinc-400
              "
            >
              <span>
                {prestador.cpf_cnpj}
              </span>

              {prestador.email && (
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {prestador.email}
                </span>
              )}

              {prestador.telefone && (
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {prestador.telefone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {historico.map(
          (
            lancamento
          ) => {
            const status =
              STATUS_CONFIG[
                lancamento.status
              ]

            return (
              <div
                key={
                  lancamento.id
                }
                className="
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-zinc-950
                  p-5
                "
              >
                <div
                  className="
                    flex
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <DollarSign
                        className="
                          w-5
                          h-5
                          text-cyan-400
                        "
                      />

                      <div
                        className="
                          text-lg
                          font-semibold
                        "
                      >
                        {fmt(
                          Number(
                            lancamento.valor
                          )
                        )}
                      </div>

                      <span
                        className={`
                          inline-flex
                          items-center
                          gap-1
                          rounded-full
                          px-2
                          py-1
                          text-xs
                          ${status?.cls}
                        `}
                      >
                        {status?.icon}

                        {status?.label}
                      </span>
                    </div>                    <div
                      className="
                        mt-2
                        text-sm
                        text-zinc-400
                      "
                    >
                      Competência:{' '}
                      {fmtMesAno(
                        lancamento.data_competencia
                      )}
                    </div>

                    <div
                      className="
                        mt-1
                        text-sm
                        text-zinc-500
                      "
                    >
                      Forma de pagamento:{' '}
                      {
                        FORMAS_PAGAMENTO_LABEL[
                          lancamento.forma_pagamento
                        ]
                      }
                    </div>

                    <div
                      className="
                        mt-1
                        text-sm
                        text-zinc-500
                      "
                    >
                      Tipo:{' '}
                      {
                        TIPO_PAGAMENTO[
                          lancamento.tipo_pagamento
                        ]
                      }
                    </div>

                    {lancamento.observacoes && (
                      <div
                        className="
                          mt-4
                          rounded-xl
                          bg-zinc-900
                          p-3
                          text-sm
                          text-zinc-300
                        "
                      >
                        {
                          lancamento.observacoes
                        }
                      </div>
                    )}
                  </div>

                  <div
                    className="
                      flex
                      flex-col
                      items-end
                      gap-2
                    "
                  >
                    {lancamento.comprovante_url && (
                      <a
                        href={
                          lancamento.comprovante_url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="
                          inline-flex
                          items-center
                          gap-2
                          rounded-xl
                          border
                          border-zinc-700
                          px-3
                          py-2
                          text-sm
                          hover:bg-zinc-900
                        "
                      >
                        <Paperclip
                          className="
                            w-4
                            h-4
                          "
                        />

                        Comprovante

                        <ExternalLink
                          className="
                            w-4
                            h-4
                          "
                        />
                      </a>
                    )}

                    {lancamento.recibo_url ? (
                      <a
                        href={
                          lancamento.recibo_url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="
                          inline-flex
                          items-center
                          gap-2
                          rounded-xl
                          bg-cyan-600
                          px-3
                          py-2
                          text-sm
                        "
                      >
                        <FileText
                          className="
                            w-4
                            h-4
                          "
                        />

                        Abrir recibo
                      </a>
                    ) : (
                      <button
                        onClick={() =>
                          gerarRecibo(
                            lancamento
                          )
                        }
                        disabled={
                          loadingId ===
                          lancamento.id
                        }
                        className="
                          inline-flex
                          items-center
                          gap-2
                          rounded-xl
                          border
                          border-cyan-700
                          px-3
                          py-2
                          text-sm
                          hover:bg-cyan-950
                        "
                      >
                        {loadingId ===
                        lancamento.id ? (
                          <Loader2
                            className="
                              w-4
                              h-4
                              animate-spin
                            "
                          />
                        ) : (
                          <FileText
                            className="
                              w-4
                              h-4
                            "
                          />
                        )}

                        Gerar recibo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          }
        )}
      </div>      {historico.length === 0 && (
        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-zinc-800
            bg-zinc-950
            p-10
            text-center
          "
        >
          <div
            className="
              text-zinc-500
            "
          >
            Nenhum lançamento encontrado
          </div>
        </div>
      )}
    </div>
  )
}