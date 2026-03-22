'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Project, Task, TimeEntry, FinancialTransaction } from '@/lib/types'
import { fmtBRL, fmtDate, fmtSeconds } from '@/lib/types'

type Props = {
  userId: string
  project: Project & { client?: { id: string; nome: string; email?: string; whatsapp?: string } | null }
  initialTasks: Task[]
  timeEntries: TimeEntry[]
  transactions: FinancialTransaction[]
}

const ETAPAS_DEFAULT = ['Briefing', 'Criação', 'Revisão', 'Aprovação', 'Entrega']
const statusLabels: Record<string, string> = { andamento: 'Em andamento', pausado: 'Pausado', concluido: 'Concluído', cancelado: 'Cancelado' }

export default function ProjectDetailClient({ userId, project, initialTasks, timeEntries, transactions }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState('tarefas')
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [etapaAtual, setEtapaAtual] = useState(project.etapa_atual)
  const [status, setStatus] = useState(project.status)
  const [saving, setSaving] = useState(false)

  // Nova tarefa
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskNome, setTaskNome] = useState('')
  const [taskPrio, setTaskPrio] = useState<'b' | 'n' | 'a'>('n')

  const etapas = project.etapas || ETAPAS_DEFAULT
  const etapaIdx = etapas.indexOf(etapaAtual)
  const progresso = etapas.length > 1 ? Math.round((etapaIdx / (etapas.length - 1)) * 100) : 0

  const totalHoras = timeEntries.reduce((s, te) => s + (te.segundos || 0), 0)
  const totalRecebido = transactions.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0)
  const tarefasConcluidas = tasks.filter(t => t.status === 'co').length

  async function avancarEtapa() {
    const nextIdx = etapaIdx + 1
    if (nextIdx >= etapas.length) return
    const next = etapas[nextIdx]
    await supabase.from('projects').update({ etapa_atual: next }).eq('id', project.id)
    setEtapaAtual(next)
  }

  async function changeStatus(s: string) {
    await supabase.from('projects').update({ status: s }).eq('id', project.id)
    setStatus(s as typeof status)
  }

  async function addTask() {
    if (!taskNome.trim()) return
    setSaving(true)
    const { data } = await supabase.from('tasks').insert({
      user_id: userId,
      project_id: project.id,
      nome: taskNome.trim(),
      prioridade: taskPrio,
      etapa: etapaAtual,
      status: 'ag',
    }).select('*').single()
    if (data) setTasks(prev => [data as Task, ...prev])
    setTaskNome(''); setShowTaskForm(false); setSaving(false)
  }

  async function toggleTask(task: Task) {
    const ns = task.status === 'co' ? 'ag' : 'co'
    await supabase.from('tasks').update({ status: ns }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: ns } : t))
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: 'var(--ts)', marginBottom: 16 }}>
        <Link href="/projects" style={{ color: 'var(--p)', textDecoration: 'none' }}>Projetos</Link>
        {' → '}{project.nome}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: project.cor || 'var(--p)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{project.nome}</h1>
          </div>
          {project.client && (
            <div style={{ fontSize: 14, color: 'var(--ts)' }}>
              👤 {project.client.nome}
              {project.client.whatsapp && (
                <a href={`https://wa.me/55${project.client.whatsapp.replace(/\D/g,'')}`} target="_blank" style={{ marginLeft: 8, color: 'var(--g)', fontSize: 12 }}>
                  WhatsApp →
                </a>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="form-input" style={{ width: 'auto' }} value={status} onChange={e => changeStatus(e.target.value)}>
            <option value="andamento">Em andamento</option>
            <option value="pausado">Pausado</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="metrics-grid" style={{ marginBottom: 28 }}>
        <div className="metric-card">
          <div className="metric-label">💰 Valor</div>
          <div className="metric-value" style={{ fontSize: 22 }}>{fmtBRL(project.valor)}</div>
          <div style={{ fontSize: 12, color: 'var(--g)' }}>{fmtBRL(totalRecebido)} recebido</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">⏱ Horas</div>
          <div className="metric-value" style={{ fontSize: 22 }}>{Math.floor(totalHoras / 3600)}h</div>
          <div style={{ fontSize: 12, color: 'var(--ts)' }}>de {project.horas_est || 0}h estimadas</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">✅ Tarefas</div>
          <div className="metric-value" style={{ fontSize: 22 }}>{tarefasConcluidas}/{tasks.length}</div>
          <div style={{ fontSize: 12, color: 'var(--ts)' }}>concluídas</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">📅 Prazo</div>
          <div className="metric-value" style={{ fontSize: 18 }}>
            {project.data_prazo ? fmtDate(project.data_prazo) : '—'}
          </div>
        </div>
      </div>

      {/* Etapas */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>Etapa atual: <span style={{ color: 'var(--p)' }}>{etapaAtual}</span></div>
            {etapaIdx < etapas.length - 1 && (
              <button className="btn bp btn-sm" onClick={avancarEtapa}>Avançar etapa →</button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {etapas.map((et: string, i: number) => (
              <div key={et} style={{ display: 'flex', alignItems: 'center', flex: i < etapas.length - 1 ? 1 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: i < etapaIdx ? 'var(--g)' : i === etapaIdx ? 'var(--p)' : 'var(--b)',
                    color: i <= etapaIdx ? '#fff' : 'var(--ts)',
                    boxShadow: i === etapaIdx ? '0 0 0 4px var(--pl)' : 'none',
                  }}>
                    {i < etapaIdx ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ts)', marginTop: 6, whiteSpace: 'nowrap' }}>{et}</div>
                </div>
                {i < etapas.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < etapaIdx ? 'var(--g)' : 'var(--b)', margin: '0 4px', marginBottom: 18 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[['tarefas', '✅ Tarefas'], ['tempo', '⏱ Tempo'], ['financeiro', '💰 Financeiro']].map(([val, label]) => (
          <button key={val} className={`tab-btn${tab === val ? ' active' : ''}`} onClick={() => setTab(val)}>
            {label}
          </button>
        ))}
      </div>

      {/* Tarefas */}
      {tab === 'tarefas' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tarefas do projeto</span>
            <button className="btn bp btn-sm" onClick={() => setShowTaskForm(true)}>+ Tarefa</button>
          </div>
          <div className="card-body">
            {showTaskForm && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, padding: 16, background: 'var(--pl)', borderRadius: 'var(--rsm)' }}>
                <input className="form-input" style={{ flex: 1 }} placeholder="Nome da tarefa" value={taskNome} onChange={e => setTaskNome(e.target.value)} autoFocus
                  onKeyDown={e => e.key === 'Enter' && addTask()} />
                <select className="form-input" style={{ width: 120 }} value={taskPrio} onChange={e => setTaskPrio(e.target.value as typeof taskPrio)}>
                  <option value="b">🟢 Baixa</option>
                  <option value="n">🔵 Normal</option>
                  <option value="a">🔴 Alta</option>
                </select>
                <button className="btn bp btn-sm" onClick={addTask} disabled={saving}>+ Add</button>
                <button className="btn bg-btn btn-sm" onClick={() => setShowTaskForm(false)}>✕</button>
              </div>
            )}
            {tasks.length === 0 && !showTaskForm ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-title">Nenhuma tarefa neste projeto</div>
                <button className="btn bp btn-sm" onClick={() => setShowTaskForm(true)}>+ Nova tarefa</button>
              </div>
            ) : (
              tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--b)' }}>
                  <input type="checkbox" checked={t.status === 'co'} onChange={() => toggleTask(t)}
                    style={{ cursor: 'pointer', accentColor: 'var(--p)', width: 16, height: 16 }} />
                  <div style={{ flex: 1, textDecoration: t.status === 'co' ? 'line-through' : 'none', color: t.status === 'co' ? 'var(--ts)' : 'inherit', fontWeight: 500 }}>
                    {t.nome}
                  </div>
                  <span style={{ fontSize: 14 }}>{t.prioridade === 'a' ? '🔴' : t.prioridade === 'b' ? '🟢' : '🔵'}</span>
                  {t.etapa && <span className="tag">{t.etapa}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tempo */}
      {tab === 'tempo' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Registros de tempo</span>
            <div style={{ fontSize: 13, color: 'var(--ts)' }}>
              Total: <strong>{Math.floor(totalHoras / 3600)}h {Math.floor((totalHoras % 3600) / 60)}m</strong>
            </div>
          </div>
          <div className="card-body">
            {timeEntries.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-state-icon">⏱</div>
                <div className="empty-state-title">Nenhum registro de tempo</div>
                <div className="empty-state-sub">Inicie o timer em uma tarefa para registrar</div>
              </div>
            ) : (
              timeEntries.map(te => (
                <div key={te.id} className="time-row">
                  <div className="time-dot" />
                  <div className="time-row-content">
                    <div className="time-row-title">{te.descricao || 'Sessão de trabalho'}</div>
                    <div className="time-row-sub">{te.data ? fmtDate(te.data) : '—'}</div>
                  </div>
                  <div className="time-row-duration">{fmtSeconds(te.segundos)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Financeiro */}
      {tab === 'financeiro' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Transações do projeto</span>
            <Link href="/financial" className="btn bp btn-sm">+ Registrar</Link>
          </div>
          <div className="card-body">
            {transactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-state-icon">💰</div>
                <div className="empty-state-title">Nenhuma transação ainda</div>
              </div>
            ) : (
              transactions.map(t => (
                <div key={t.id} className="fin-row">
                  <div style={{ fontSize: 18 }}>{t.tipo === 'entrada' ? '💸' : '🧾'}</div>
                  <div className="fin-row-content">
                    <div className="fin-row-title">{t.descricao || (t.tipo === 'entrada' ? 'Recebimento' : 'Despesa')}</div>
                    <div className="fin-row-sub">{t.subtipo} · {t.forma_pag} · {t.data ? fmtDate(t.data) : '—'}</div>
                  </div>
                  <div className={`fin-row-value ${t.tipo === 'entrada' ? 'pos' : 'neg'}`}>
                    {t.tipo === 'entrada' ? '+' : '-'}{fmtBRL(t.valor)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
