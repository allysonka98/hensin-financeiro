'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

interface Props {
  periodo: string
  basePath: string
}

export default function MesNav({ periodo, basePath }: Props) {
  const router = useRouter()
  const [y, m] = periodo.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1">
      <button
        onClick={() => router.push(`${basePath}?mes=${prevMes(periodo)}`)}
        className="p-1 text-gray-400 hover:text-white transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-white text-sm font-medium px-2 w-40 text-center capitalize">
        {label}
      </span>
      <button
        onClick={() => router.push(`${basePath}?mes=${nextMes(periodo)}`)}
        className="p-1 text-gray-400 hover:text-white transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
