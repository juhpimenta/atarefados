'use client'
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from './supabase'

type TimerState = {
  taskId: string | null
  taskName: string
  projectId: string | null
  elapsedSec: number
  running: boolean
  startedAt: number | null   // epoch ms
  userId: string | null
}

const DEFAULT: TimerState = {
  taskId: null, taskName: '', projectId: null,
  elapsedSec: 0, running: false, startedAt: null, userId: null,
}

const LS_KEY = 'atf_timer_v1'

type TimerCtx = TimerState & {
  startTimer: (taskId: string, taskName: string, projectId?: string | null, userId?: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopAndSave: () => Promise<void>
}

const Ctx = createContext<TimerCtx | null>(null)

export function TimerProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [state, setState] = useState<TimerState>({ ...DEFAULT, userId })
  const ref = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // Recover from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return
      const saved: TimerState = JSON.parse(raw)
      if (saved.userId !== userId) { localStorage.removeItem(LS_KEY); return }
      if (saved.running && saved.startedAt) {
        const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000)
        setState({ ...saved, elapsedSec: elapsed })
      } else {
        setState(saved)
      }
    } catch { localStorage.removeItem(LS_KEY) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tick
  useEffect(() => {
    if (state.running) {
      ref.current = setInterval(() => setState(s => ({ ...s, elapsedSec: s.elapsedSec + 1 })), 1000)
    } else {
      if (ref.current) clearInterval(ref.current)
    }
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [state.running])

  // Persist
  useEffect(() => {
    if (state.taskId) localStorage.setItem(LS_KEY, JSON.stringify(state))
    else localStorage.removeItem(LS_KEY)
  }, [state])

  const startTimer = useCallback((taskId: string, taskName: string, projectId?: string | null, uid?: string) => {
    if (ref.current) clearInterval(ref.current)
    setState({ taskId, taskName, projectId: projectId ?? null, elapsedSec: 0, running: true, startedAt: Date.now(), userId: uid ?? userId })
  }, [userId])

  const pauseTimer = useCallback(() => setState(s => ({ ...s, running: false })), [])

  const resumeTimer = useCallback(() =>
    setState(s => ({ ...s, running: true, startedAt: Date.now() - s.elapsedSec * 1000 })), [])

  const stopAndSave = useCallback(async () => {
    if (ref.current) clearInterval(ref.current)
    const snap = state   // capture before reset
    setState({ ...DEFAULT, userId })

    if (!snap.taskId || snap.elapsedSec < 5) return
    const uid = snap.userId ?? userId
    await supabase.from('time_entries').insert({
      user_id: uid,
      task_id: snap.taskId,
      project_id: snap.projectId,
      segundos: snap.elapsedSec,
      iniciado_em: snap.startedAt ? new Date(snap.startedAt).toISOString() : new Date().toISOString(),
      finalizado_em: new Date().toISOString(),
      data: new Date().toISOString().split('T')[0],
      descricao: snap.taskName,
    })
    const { data: task } = await supabase.from('tasks').select('horas_real').eq('id', snap.taskId).single()
    const hReal = (task?.horas_real || 0) + snap.elapsedSec / 3600
    await supabase.from('tasks').update({ horas_real: hReal }).eq('id', snap.taskId)
  }, [state, userId, supabase])

  return (
    <Ctx.Provider value={{ ...state, startTimer, pauseTimer, resumeTimer, stopAndSave }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTimer() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTimer must be inside TimerProvider')
  return ctx
}
