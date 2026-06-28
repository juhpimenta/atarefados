'use client'
import { useState, useEffect, useRef } from 'react'
import { fmtSeconds } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import { Pause, Play, Square } from 'lucide-react'

export default function DashboardClient({ userId }: { userId: string }) {
  const [timerSec, setTimerSec] = useState(0)
  const [running, setRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  function start() {
    if (running) return
    setRunning(true)
    setStartedAt(new Date())
    intervalRef.current = setInterval(() => setTimerSec(s => s + 1), 1000)
  }

  function pause() {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  async function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timerSec > 0 && startedAt) {
      await supabase.from('time_entries').insert({
        user_id: userId,
        segundos: timerSec,
        iniciado_em: startedAt.toISOString(),
        finalizado_em: new Date().toISOString(),
        data: new Date().toISOString().split('T')[0],
        descricao: 'Timer manual',
      })
    }
    setRunning(false)
    setTimerSec(0)
    setStartedAt(null)
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  if (timerSec === 0 && !running) return null

  const btnStyle = {
    width: 34, height: 34, borderRadius: 8,
    background: 'rgba(255,255,255,.15)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer',
  }

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28,
      background: 'var(--p)', color: '#fff',
      borderRadius: 16, padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: 'var(--shm)', zIndex: 200, minWidth: 260,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: running ? 'var(--o)' : '#fff',
        flexShrink: 0,
        animation: running ? 'pulse 1.5s infinite' : 'none',
      }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '.02em' }}>
          {fmtSeconds(timerSec)}
        </div>
        <div style={{ fontSize: 11, opacity: .7 }}>{running ? 'Registrando...' : 'Pausado'}</div>
      </div>
      <button onClick={running ? pause : start} style={btnStyle}>
        {running ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button onClick={stop} style={btnStyle}>
        <Square size={14} />
      </button>
    </div>
  )
}
