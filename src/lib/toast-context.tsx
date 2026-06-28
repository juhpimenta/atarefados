'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type TType = 'success' | 'error' | 'info'
type Toast  = { id: string; type: TType; message: string }
type ToastCtx = { toast: (msg: string, type?: TType) => void }

const Ctx = createContext<ToastCtx | null>(null)

const cfg = {
  success: { bg: 'var(--gl)', border: '#18A058', color: '#157040', Icon: CheckCircle2 },
  error:   { bg: 'var(--rl)', border: '#D94040', color: '#D94040', Icon: XCircle },
  info:    { bg: 'var(--pl)', border: '#5413A0', color: '#5413A0', Icon: Info },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), [])

  const toast = useCallback((message: string, type: TType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(p => [...p, { id, type, message }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}

      {/* Container */}
      <div className="toast-wrap" style={{
        position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999, pointerEvents: 'none', alignItems: 'center',
      }}>
        {toasts.map(t => {
          const { bg, border, color, Icon } = cfg[t.type]
          return (
            <div key={t.id} style={{
              background: bg, border: `1px solid ${border}`, borderRadius: 12,
              padding: '12px 18px 12px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 4px 24px rgba(0,0,0,.14)',
              fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap',
              pointerEvents: 'all',
              animation: 'toastIn .22s cubic-bezier(.22,1,.36,1)',
            }}>
              <Icon size={16} color={color} strokeWidth={2} />
              <span style={{ color: '#1a1a2e' }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4, color, opacity: .6, display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
