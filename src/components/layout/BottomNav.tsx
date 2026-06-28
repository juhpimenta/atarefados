'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, FolderOpen, Timer, DollarSign } from 'lucide-react'
import { useUI } from '@/lib/ui-context'

const NAV = [
  { href: '/dashboard',  label: 'Início',    Icon: LayoutDashboard },
  { href: '/tasks',      label: 'Tarefas',   Icon: CheckSquare },
  { href: '/projects',   label: 'Projetos',  Icon: FolderOpen },
  { href: '/financial',  label: 'Financeiro',Icon: DollarSign },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { openModal } = useUI()

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <div className="bottom-nav-inner">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={`bottom-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
        {/* Timer action — opens modal instead of navigating */}
        <button
          className="bottom-nav-item"
          onClick={() => openModal('timer')}
          aria-label="Iniciar timer"
        >
          <Timer size={22} strokeWidth={1.8} />
          <span>Timer</span>
        </button>
      </div>
    </nav>
  )
}
