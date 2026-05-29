'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  Users,
  UserRound,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
  { href: '/contas-fixas', label: 'Contas Fixas', icon: Receipt },
  { href: '/prestadores', label: 'Prestadores', icon: Users },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/clientes', label: 'Clientes', icon: UserRound },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

interface Props {
  contasVencendoBadge?: number
}

export default function Sidebar({ contasVencendoBadge = 0 }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-white font-bold text-lg leading-tight">
          Hensin<span className="text-blue-400"> Financeiro</span>
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const showBadge = href === '/contas-fixas' && contasVencendoBadge > 0
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
              {showBadge && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                  {contasVencendoBadge > 9 ? '9+' : contasVencendoBadge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
