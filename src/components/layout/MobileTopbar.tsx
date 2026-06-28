'use client'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import type { Profile } from '@/lib/types'

const pageTitles: Record<string, string> = {
  '/dashboard':  'Início',
  '/tasks':      'Tarefas',
  '/projects':   'Projetos',
  '/clients':    'Clientes',
  '/financial':  'Financeiro',
  '/insights':   'Insights',
  '/settings':   'Configurações',
}

export default function MobileTopbar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const key = Object.keys(pageTitles).find(k => pathname === k || pathname.startsWith(k + '/')) || '/dashboard'
  const title = pageTitles[key] || 'Atarefados'

  function openNav() {
    document.getElementById('sidebar')?.classList.add('open')
    document.getElementById('mobOv')?.classList.add('open')
  }

  function closeNav() {
    document.getElementById('sidebar')?.classList.remove('open')
    document.getElementById('mobOv')?.classList.remove('open')
  }

  return (
    <>
      <style>{`
        .mobile-topbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 0 4px 0 8px; height: 56px;
          background: var(--p); position: sticky; top: 0; z-index: 200;
          flex-shrink: 0;
        }
        @media (max-width: 900px) {
          .mobile-topbar { display: flex; }
        }
      `}</style>

      <div className="mobile-topbar" role="banner">
        {/* Hamburger — 44x44 touch target */}
        <button
          onClick={openNav}
          aria-label="Abrir menu lateral"
          aria-expanded="false"
          aria-controls="sidebar"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 5,
            width: 44, height: 44, borderRadius: 8, flexShrink: 0,
          }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 16, height: 2, background: 'rgba(255,255,255,.7)', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2 }} />
        </button>

        {/* Page title */}
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-.01em' }}>
          {title}
        </div>

        {/* Right action — avatar / notifications */}
        <div
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,.18)', border: '1.5px solid rgba(255,255,255,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14,
            cursor: 'default', flexShrink: 0, margin: '0 4px',
          }}
          title={profile?.nome || 'Conta'}
          aria-label="Conta"
        >
          {profile?.nome?.charAt(0).toUpperCase() || '?'}
        </div>
      </div>

      {/* Mobile overlay — closes sidebar on outside click */}
      <div id="mobOv" className="mob-overlay" onClick={closeNav} aria-hidden="true" />
    </>
  )
}
