'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { initials } from '@/lib/types'
import type { Profile } from '@/lib/types'
import {
  LayoutDashboard, CheckSquare, FolderOpen, Users,
  Wallet, Lightbulb, Settings, Zap, LogOut, Timer,
} from 'lucide-react'
import { useUI } from '@/lib/ui-context'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tasks',     icon: CheckSquare,     label: 'Tarefas' },
  { href: '/projects',  icon: FolderOpen,      label: 'Projetos' },
  { href: '/clients',   icon: Users,           label: 'Clientes' },
  { href: '/financial', icon: Wallet,          label: 'Financeiro' },
  { href: '/insights',  icon: Lightbulb,       label: 'Insights' },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const { openModal } = useUI()
  const nome = profile?.nome || 'Usuário'
  const ini = initials(nome)

  return (
    <>
      <aside className="sidebar" id="sidebar" aria-label="Menu lateral">
        {/* Logo */}
        <div style={{
          padding: '22px 20px 18px', display: 'flex', alignItems: 'center', gap: 10,
          color: '#fff', fontWeight: 700, fontSize: 18,
          borderBottom: '1px solid rgba(255,255,255,.12)',
        }}>
          <div style={{
            width: 32, height: 32, background: 'rgba(255,255,255,.18)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Zap size={16} color="#fff" /></div>
          Atarefados
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }} aria-label="Navegação principal">
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.08em',
            color: 'rgba(255,255,255,.45)', textTransform: 'uppercase',
            padding: '14px 12px 6px',
          }} aria-hidden="true">Menu</div>

          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href} href={item.href}
                aria-current={active ? 'page' : undefined}
                style={{
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  color: active ? '#fff' : 'rgba(255,255,255,.65)',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  background: active ? 'rgba(242,140,40,.22)' : 'transparent',
                  borderLeft: active ? '3px solid var(--o)' : '3px solid transparent',
                  transition: 'all .18s', minHeight: 44,
                }}
              >
                <Icon size={17} color={active ? 'var(--o)' : undefined} aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}

          {/* Iniciar Timer button */}
          <div style={{ padding: '8px 0 4px' }}>
            <button
              onClick={() => openModal('timer')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(242,140,40,.4)',
                background: 'rgba(242,140,40,.12)', color: 'var(--o)',
                cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all .18s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(242,140,40,.22)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(242,140,40,.12)' }}
            >
              <Timer size={16} color="var(--o)" />
              Iniciar Timer
            </button>
          </div>

          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.08em',
            color: 'rgba(255,255,255,.45)', textTransform: 'uppercase',
            padding: '14px 12px 6px',
          }}>Conta</div>

          <Link href="/settings" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              color: pathname === '/settings' ? '#fff' : 'rgba(255,255,255,.65)',
              background: pathname === '/settings' ? 'rgba(242,140,40,.22)' : 'transparent',
              borderLeft: pathname === '/settings' ? '3px solid var(--o)' : '3px solid transparent',
              fontWeight: pathname === '/settings' ? 600 : 400,
              fontSize: 14, cursor: 'pointer', transition: 'all .18s',
            }}>
              <Settings size={17} color={pathname === '/settings' ? 'var(--o)' : undefined} />
              Configurações
            </div>
          </Link>
        </nav>

        {/* User */}
        <div style={{ padding: '16px 10px', borderTop: '1px solid rgba(255,255,255,.12)' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
            }}
            onClick={logout}
            title="Sair"
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--o)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600,
            }}>{ini}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</div>
              <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <LogOut size={10} /> Sair
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
