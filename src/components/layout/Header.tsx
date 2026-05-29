'use client'

import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/lancamentos': 'Lançamentos',
  '/contas-fixas': 'Contas Fixas',
  '/prestadores': 'Prestadores',
  '/contratos': 'Contratos',
  '/clientes': 'Clientes',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
}

interface HeaderProps {
  userEmail?: string | null
}

export default function Header({ userEmail }: HeaderProps) {
  const pathname = usePathname()
  const title =
    pageTitles[pathname] ??
    Object.entries(pageTitles).find(([k]) => pathname.startsWith(k + '/'))?.[1] ??
    'Sistema'

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
      <h2 className="text-white font-semibold text-lg">{title}</h2>

      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="text-gray-400 text-sm hidden sm:block">
            {userEmail}
          </span>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sair</span>
          </button>
        </form>
      </div>
    </header>
  )
}
