'use client'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/lib/types'

const pageTitles: Record<string, [string, string]> = {
  '/dashboard':  ['Dashboard', 'Visão geral'],
  '/tasks':      ['Tarefas', 'Gerenciar tarefas'],
  '/projects':   ['Projetos', 'Seus projetos'],
  '/clients':    ['Clientes', 'Carteira de clientes'],
  '/financial':  ['Financeiro', 'Controle financeiro'],
  '/insights':   ['Insights', 'Padrões do seu trabalho'],
  '/settings':   ['Configurações', 'Perfil e preferências'],
}

export default function MobileTopbar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const key = Object.keys(pageTitles).find(k => pathname === k || pathname.startsWith(k + '/')) || '/dashboard'
  const [title] = pageTitles[key] || ['Atarefados', '']

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
          padding: 0 16px; height: 56px;
          background: var(--p); position: sticky; top: 0; z-index: 200;
        }
        .desktop-topbar {
          background: var(--s); border-bottom: 1px solid var(--b);
          padding: 0 32px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
        }
        @media (max-width: 900px) {
          .mobile-topbar { display: flex; }
          .desktop-topbar { display: none; }
        }
      `}</style>

      {/* Desktop topbar */}
      <div className="desktop-topbar">
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--ts)' }}>{pageTitles[key]?.[1]}</div>
        </div>
      </div>

      {/* Mobile topbar */}
      <div className="mobile-topbar">
        <button
          onClick={openNav}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, padding: 6 }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2 }} />
        </button>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>⚡ {title}</div>
        <div style={{ width: 34 }} />
      </div>

      {/* Mobile overlay — fecha ao clicar */}
      <div id="mobOv" className="mob-overlay" onClick={closeNav} />
    </>
  )
}
