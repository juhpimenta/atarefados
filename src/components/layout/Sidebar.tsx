'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { initials } from '@/lib/types'
import type { Profile } from '@/lib/types'

const navItems = [
  { href: '/dashboard',  icon: '📊', label: 'Dashboard' },
  { href: '/tasks',      icon: '✅', label: 'Tarefas' },
  { href: '/projects',   icon: '📁', label: 'Projetos' },
  { href: '/clients',    icon: '👥', label: 'Clientes' },
  { href: '/financial',  icon: '💰', label: 'Financeiro' },
  { href: '/insights',   icon: '💡', label: 'Insights' },
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

  const nome = profile?.nome || 'Usuário'
  const ini = initials(nome)

  return (
    <>
      <style>{`
        .sidebar {
          width: var(--sw); background: var(--p);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; height: 100vh;
          z-index: 200; transition: transform .25s ease;
        }
        .mob-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,.4); z-index: 150;
        }
        @media (max-width: 900px) {
          .sidebar { transform: translateX(-100%); box-shadow: var(--shm); }
          .sidebar.open { transform: translateX(0) !important; z-index: 250; }
          .mob-overlay.open { display: block; }
        }
      `}</style>
      <aside className="sidebar" id="sidebar">
        {/* Logo */}
        <div style={{
          padding: '22px 20px 18px', display: 'flex', alignItems: 'center', gap: 10,
          color: '#fff', fontWeight: 700, fontSize: 18,
          borderBottom: '1px solid rgba(255,255,255,.12)',
        }}>
          <div style={{
            width: 32, height: 32, background: 'rgba(255,255,255,.18)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⚡</div>
          Atarefados
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.08em',
            color: 'rgba(255,255,255,.45)', textTransform: 'uppercase',
            padding: '14px 12px 6px',
          }}>Menu</div>

          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  color: active ? '#fff' : 'rgba(255,255,255,.75)',
                  fontWeight: active ? 500 : 400,
                  fontSize: 14, cursor: 'pointer',
                  background: active ? 'rgba(255,255,255,.18)' : 'transparent',
                  transition: 'all .18s',
                }}>
                  <span>{item.icon}</span>
                  {item.label}
                </div>
              </Link>
            )
          })}

          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.08em',
            color: 'rgba(255,255,255,.45)', textTransform: 'uppercase',
            padding: '14px 12px 6px',
          }}>Conta</div>

          <Link href="/settings" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              color: pathname === '/settings' ? '#fff' : 'rgba(255,255,255,.75)',
              background: pathname === '/settings' ? 'rgba(255,255,255,.18)' : 'transparent',
              fontWeight: pathname === '/settings' ? 500 : 400,
              fontSize: 14, cursor: 'pointer', transition: 'all .18s',
            }}>
              <span>⚙️</span> Configurações
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
              <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 11 }}>Sair →</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
