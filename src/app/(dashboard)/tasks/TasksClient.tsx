'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Task, Project } from '@/lib/types'
import { fmtSeconds } from '@/lib/types'

type Props = { userId: string; initialTasks: Task[]; projects: Pick<Project, 'id' | 'nome' | 'etapas' | 'etapa_atual'>[] }

const statusMap = { ag: 'Aguardando', an: 'Em andamento', co: 'Concluída' }
const prioMap = { b: '🟢 Baixa', n: '🔵 Normal', a: '🔴 Alta' }

export default function TasksClient({ userId, initialTasks, projects }: Props) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filter, setFilter] = useState<'t' | 'ag' | 'an' | 'co'>('t')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [nome, setNome] = useState('')
  const [projectId, setProjectId] = useState('')
  const [status, setStatus] = useState<'ag' | 'an' | 'co'>('ag')
  const [prio, setPrio] = useState<'b' | 'n' | 'a'>('n')
  const [etapa, setEtapa] = useState('')
  const [horasEst, setHorasEst] = useState('')
  const [minutosEst, setMinutosEst] = useState('')
  const [prazo, setPrazo] = useState('')

  // Timer
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null)
  const [timerSec, setTimerSec] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerStart, setTimerStart] = useState<Date | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const selectedProject = projects.find(p => p.id === projectId)
  const etapas = selectedProject?.etapas || []

  async function addTask(startTimer = false) {
    if (!nome.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('tasks').insert({
      user_id: userId,
      nome: nome.trim(),
      project_id: projectId || null,
      status,
      prioridade: prio,
      etapa: etapa || null,
      horas_est: parseFloat(horasEst) || 0,
      minutos_est: parseInt(minutosEst) || 0,
      prazo: prazo || null,
    }).select('*, project:projects(id, nome, cor)').single()

    if (!error && data) {
      setTasks(prev => [data as Task, ...prev])
      resetForm()
      if (startTimer) startTimerForTask(data.id)
    }
    setSaving(false)
  }

  function resetForm() {
    setNome(''); setProjectId(''); setStatus('ag'); setPrio('n')
    setEtapa(''); setHorasEst(''); setMinutosEst(''); setPrazo('')
    setShowForm(false)
  }

  async function toggleTaskStatus(task: Task) {
    const newStatus = task.status === 'co' ? 'ag' : 'co'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
  }

  async function deleteTask(id: string) {
    if (!confirm('Excluir esta tarefa?')) return
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function startTimerForTask(taskId: string) {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerTaskId(taskId)
    setTimerSec(0)
    setTimerRunning(true)
    setTimerStart(new Date())
    timerRef.current = setInterval(() => setTimerSec(s => s + 1), 1000)
  }

  async function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (timerSec > 0 && timerStart && timerTaskId) {
      const task = tasks.find(t => t.id === timerTaskId)
      await supabase.from('time_entries').insert({
        user_id: userId,
        task_id: timerTaskId,
        project_id: task?.project_id || null,
        segundos: timerSec,
        iniciado_em: timerStart.toISOString(),
        finalizado_em: new Date().toISOString(),
        data: new Date().toISOString().split('T')[0],
        descricao: task?.nome || 'Timer',
      })
      // Atualizar horas reais da tarefa
      const hReal = (task?.horas_real || 0) + timerSec / 3600
      await supabase.from('tasks').update({ horas_real: hReal }).eq('id', timerTaskId)
      setTasks(prev => prev.map(t => t.id === timerTaskId ? { ...t, horas_real: hReal } : t))
    }
    setTimerRunning(false); setTimerSec(0); setTimerTaskId(null); setTimerStart(null)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const filtered = filter === 't' ? tasks : tasks.filter(t => t.status === filter)
  const counts = {
    t: tasks.length,
    ag: tasks.filter(t => t.status === 'ag').length,
    an: tasks.filter(t => t.status === 'an').length,
    co: tasks.filter(t => t.status === 'co').length,
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Tarefas</h1>
          <p style={{ color: 'var(--ts)', fontSize: 13 }}>{counts.t} tarefas · {counts.co} concluídas</p>
        </div>
        <button className="btn bp" onClick={() => setShowForm(true)}>+ Nova tarefa</button>
      </div>

      {/* Filtros */}
      <div className="tabs">
        {([['t', 'Todas'], ['ag', 'Aguardando'], ['an', 'Em andamento'], ['co', 'Concluídas']] as const).map(([val, label]) => (
          <button key={val} className={`tab-btn${filter === val ? ' active' : ''}`} onClick={() => setFilter(val)}>
            {label} <span style={{ fontSize: 11, background: 'var(--b)', borderRadius: 10, padding: '1px 7px', marginLeft: 4 }}>{counts[val]}</span>
          </button>
        ))}
      </div>

      {/* Form nova tarefa */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24, border: '2px solid var(--p)' }}>
          <div className="card-body">
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Nova tarefa</div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Nome da tarefa *</label>
                <input className="form-input" placeholder="Ex: Criar layout da home" value={nome} onChange={e => setNome(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="form-label">Projeto</label>
                <select className="form-input" value={projectId} onChange={e => { setProjectId(e.target.value); setEtapa('') }}>
                  <option value="">— Sem projeto —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-input" value={status} onChange={e => setStatus(e.target.value as typeof status)}>
                  <option value="ag">Aguardando</option>
                  <option value="an">Em andamento</option>
                  <option value="co">Concluída</option>
                </select>
              </div>
              <div>
                <label className="form-label">Prioridade</label>
                <select className="form-input" value={prio} onChange={e => setPrio(e.target.value as typeof prio)}>
                  <option value="b">🟢 Baixa</option>
                  <option value="n">🔵 Normal</option>
                  <option value="a">🔴 Alta</option>
                </select>
              </div>
              {etapas.length > 0 && (
                <div>
                  <label className="form-label">Etapa do projeto</label>
                  <select className="form-input" value={etapa} onChange={e => setEtapa(e.target.value)}>
                    <option value="">— Sem etapa —</option>
                    {etapas.map((et: string) => <option key={et} value={et}>{et}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Estimativa</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" type="number" placeholder="0h" min="0" value={horasEst} onChange={e => setHorasEst(e.target.value)} style={{ width: 80 }} />
                  <input className="form-input" type="number" placeholder="0m" min="0" max="59" value={minutosEst} onChange={e => setMinutosEst(e.target.value)} style={{ width: 80 }} />
                </div>
              </div>
              <div>
                <label className="form-label">Prazo</label>
                <input className="form-input" type="date" value={prazo} onChange={e => setPrazo(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn bg-btn" onClick={resetForm}>Cancelar</button>
              <button className="btn bs" onClick={() => addTask(false)} disabled={saving}>
                {saving ? 'Salvando...' : '+ Adicionar'}
              </button>
              <button className="btn bp" onClick={() => addTask(true)} disabled={saving}>
                ⏱ Adicionar e iniciar timer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de tarefas */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Tarefa</th>
                <th>Projeto / Etapa</th>
                <th>Estimativa</th>
                <th>Horas reais</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Prazo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon">✅</div>
                      <div className="empty-state-title">Nenhuma tarefa aqui</div>
                      <button className="btn bp btn-sm" onClick={() => setShowForm(true)}>Nova tarefa</button>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(t => (
                <tr key={t.id} style={{ background: t.status === 'an' ? '#fdf9ff' : '' }}>
                  <td>
                    <input type="checkbox" checked={t.status === 'co'} onChange={() => toggleTaskStatus(t)}
                      style={{ cursor: 'pointer', accentColor: 'var(--p)', width: 16, height: 16 }} />
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, textDecoration: t.status === 'co' ? 'line-through' : 'none', color: t.status === 'co' ? 'var(--ts)' : 'inherit' }}>
                      {t.nome}
                    </div>
                    {timerTaskId === t.id && (
                      <div style={{ fontSize: 12, color: 'var(--o)', fontWeight: 600 }}>⏱ {fmtSeconds(timerSec)}</div>
                    )}
                  </td>
                  <td>
                    {t.project ? <span className="tag">{(t.project as any).nome}</span> : '—'}
                    {t.etapa && <span style={{ fontSize: 12, color: 'var(--ts)', marginLeft: 6 }}>{t.etapa}</span>}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--ts)' }}>
                    {(t.horas_est || t.minutos_est) ? `${t.horas_est || 0}h ${t.minutos_est || 0}m` : '—'}
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>
                    {t.horas_real > 0 ? `${t.horas_real.toFixed(1)}h` : '—'}
                  </td>
                  <td>{t.prioridade === 'a' ? '🔴' : t.prioridade === 'b' ? '🟢' : '🔵'}</td>
                  <td>
                    <span className={`bdg ${t.status === 'co' ? 'bdg-g' : t.status === 'an' ? 'bdo' : 'bdgr'}`}>
                      {statusMap[t.status]}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--ts)' }}>
                    {t.prazo ? t.prazo.split('-').reverse().join('/') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {t.status !== 'co' && (
                        timerTaskId === t.id ? (
                          <button className="btn btn-danger btn-sm" onClick={stopTimer}>⏹ Parar</button>
                        ) : (
                          <button className="btn bp btn-sm" onClick={() => startTimerForTask(t.id)}>⏱</button>
                        )
                      )}
                      <button className="btn bg-btn btn-sm" onClick={() => deleteTask(t.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timer flutuante */}
      {timerTaskId && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28,
          background: 'var(--p)', color: '#fff', borderRadius: 16,
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: 'var(--shm)', zIndex: 200, minWidth: 260,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: timerRunning ? 'var(--o)' : '#ccc', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtSeconds(timerSec)}</div>
            <div style={{ fontSize: 11, opacity: .7, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tasks.find(t => t.id === timerTaskId)?.nome}
            </div>
          </div>
          <button onClick={() => timerRunning ? (clearInterval(timerRef.current!), setTimerRunning(false)) : startTimerForTask(timerTaskId)}
            style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 14, border: 'none', cursor: 'pointer' }}>
            {timerRunning ? '⏸' : '▶'}
          </button>
          <button onClick={stopTimer}
            style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 14, border: 'none', cursor: 'pointer' }}>
            ⏹
          </button>
        </div>
      )}
    </div>
  )
}
