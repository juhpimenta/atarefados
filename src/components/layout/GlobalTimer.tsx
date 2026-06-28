'use client'
import { useTimer } from '@/lib/timer-context'
import { useToast } from '@/lib/toast-context'
import { fmtSeconds } from '@/lib/types'
import { Pause, Play, Square } from 'lucide-react'

export default function GlobalTimer() {
  const timer = useTimer()
  const { toast } = useToast()

  if (!timer.taskId) return null

  async function handleStop() {
    await timer.stopAndSave()
    toast('Timer finalizado e salvo', 'success')
  }

  function handlePauseResume() {
    if (timer.running) {
      timer.pauseTimer()
      toast('Timer pausado', 'info')
    } else {
      timer.resumeTimer()
      toast('Timer retomado', 'info')
    }
  }

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%  { transform:scale(1); opacity:.6; }
          100%{ transform:scale(2.4); opacity:0; }
        }
        .gtimer-btn {
          width:36px; height:36px; border-radius:10px; border:none;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          transition:all .15s;
        }
        .gtimer-btn:hover { filter:brightness(1.2); }
      `}</style>
      <div className="global-timer-wrap" style={{
        position: 'fixed', bottom: 28, right: 28,
        background: '#0f0f1a',
        border: `1.5px solid ${timer.running ? 'var(--o)' : '#333'}`,
        borderRadius: 18, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: `0 8px 40px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.04)`,
        zIndex: 400, minWidth: 290, color: '#fff',
        transition: 'border-color .3s',
      }}>
        {/* Pulse indicator */}
        <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: timer.running ? 'var(--o)' : '#444' }} />
          {timer.running && (
            <div style={{
              position: 'absolute', inset: -3, borderRadius: '50%',
              border: '2px solid var(--o)',
              animation: 'pulse-ring 1.6s ease-out infinite',
            }} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
            color: timer.running ? 'var(--o)' : '#666', marginBottom: 2,
          }}>
            {timer.running ? 'Trabalhando agora' : 'Pausado'}
          </div>
          <div style={{
            fontSize: 12, color: '#aaa', marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150,
          }}>
            {timer.taskName}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', lineHeight: 1 }}>
            {fmtSeconds(timer.elapsedSec)}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            className="gtimer-btn"
            onClick={handlePauseResume}
            title={timer.running ? 'Pausar' : 'Retomar'}
            style={{ background: 'rgba(255,255,255,.08)', color: '#fff' }}
          >
            {timer.running ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            className="gtimer-btn"
            onClick={handleStop}
            title="Finalizar e salvar"
            style={{ background: 'rgba(217,64,64,.18)', color: '#f88', border: '1px solid rgba(217,64,64,.3)' }}
          >
            <Square size={13} />
          </button>
        </div>
      </div>
    </>
  )
}
