import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export type TaskEstimate = {
  horas: number
  minutos: number
  totalMinutos: number
  baseadoEm: number
  mediaMinutos: number
  ajustePercent?: number
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null, { status: 401 })

  const { nome, projectId } = await req.json() as { nome: string; projectId?: string }
  if (!nome || nome.trim().length < 3) return NextResponse.json(null)

  const queryTokens = tokenize(nome)
  if (queryTokens.length === 0) return NextResponse.json(null)

  const { data: past } = await supabase
    .from('tasks')
    .select('nome, horas_real, horas_est, minutos_est, project_id')
    .eq('user_id', user.id)
    .eq('status', 'co')
    .gt('horas_real', 0)
    .order('created_at', { ascending: false })
    .limit(300)

  if (!past || past.length === 0) return NextResponse.json(null)

  // Score each past task by token overlap
  const scored = past
    .map(t => {
      const tt = tokenize(t.nome)
      const matches = queryTokens.filter(q => tt.some(w => w.includes(q) || q.includes(w)))
      const score = matches.length / Math.max(queryTokens.length, 1)
      const bonus = projectId && t.project_id === projectId ? 0.25 : 0
      return { ...t, score: score + bonus }
    })
    .filter(t => t.score >= 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  if (scored.length === 0) return NextResponse.json(null)

  // Weighted mean (heavier weight on better matches)
  const totalW = scored.reduce((s, t) => s + t.score, 0)
  const wMin   = scored.reduce((s, t) => s + (t.horas_real * 60) * t.score, 0)
  const avgMin = Math.round(wMin / totalW)

  const horas   = Math.floor(avgMin / 60)
  const minutos = avgMin % 60

  return NextResponse.json({
    horas,
    minutos,
    totalMinutos: avgMin,
    baseadoEm: scored.length,
    mediaMinutos: avgMin,
  } satisfies TaskEstimate)
}
