import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CAT_LABELS: Record<string, string> = {
  honorarios: 'Honorários',
  prestador: 'Prestador',
  conta_fixa: 'Conta Fixa',
  imposto: 'Imposto',
  escritorio: 'Escritório',
  marketing: 'Marketing',
  outros: 'Outros',
}

export function fmtCategoria(cat: string): string {
  if (!cat) return ''
  return (
    CAT_LABELS[cat] ??
    cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  )
}
