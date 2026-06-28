'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { Task, Project } from '@/lib/types'
import { useTimer } from '@/lib/timer-context'
import { useToast } from '@/lib/toast-context'
import { useUI } from '@/lib/ui-context'
import { Timer, Pencil, Trash2, CheckCircle2, X, RotateCcw } from 'lucide-react'

type Props = { userId: string; initialTasks: Task[]; projects: Pick<Project, 'id' | 'nome' | 'etapas' | 'etapa_atual'>[] }

const statusMap = { ag: 'Aguardando', an: 'Em andamento', co: 'Concluída' }

function PrioDot({ prio }: { prio: string }) {
  const color = prio === 'a' ? 'var(--r)' : prio === 'b' ? 'var(--g)' : 'var(--p)'
  return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
}

export default function TasksClient({ userId, initialTasks, projects }: Props) {
  const supabase = createClient()
  const timer = useTimer()
  const { toast } = useToast()
  const { openModal } = useUI()

  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filter, setFilter] = useState<'t' | 'ag' | 'an' | 'co'>('t')
  const mountedRef = useRef(false)

  // Sync when server re-fetches (navigation), but skip the first mount
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    setTasks(initialTasks)
  }, [initialTasks])

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editProjectId, setEditProjectId] = useState('')
  const [editStatus, setEditStatus] = useState<'ag' | 'an' | 'co'>('ag')
  const [editPrio, setEditPrio] = useState<'b' | 'n' | 'a'>('n')
  const [editEtapa, setEditEtapa] = useState('')
  const [editHorasEst, setEditHorasEst] = useState('')
  const [editMinutosEst, setEditMinutosEst] = useState('')
  const [editPrazo, setEditPrazo] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  function openEdit(task: Task) {
    setEditingTask(task)
    setEditNome(task.nome)
    setEditProjectId(task.project_id || '')
    setEditStatus(task.status)
    setEditPrio(task.prioridade)
    setEditEtapa(task.etapa || '')
    setEditHorasEst(task.horas_est?.toString() || '')
    setEditMinutosEst(task.minutos_est?.toString() || '')
    setEditPrazo(task.prazo || '')
  }

  async function saveEdit() {
    if (!editingTask || !editNome.trim()) return
    setEditSaving(true)
    const { data, error } = await supabase.from('tasks').update({
      nome: editNome.trim(),
      project_id: editProjectId || null,
      status: editStatus,
      prioridade: editPrio,
      etapa: editEtapa || null,
      horas_est: parseFloat(editHorasEst) || 0,
      minutos_est: parseInt(editMinutosEst) || 0,
      prazo: editPrazo || null,
    }).eq('id', editingTask.id).select('*').single()

    if (!error && data) {
      const proj = editProjectId ? projects.find(p => p.id === editProjectId) : null
      const updated: Task = {
        ...data,
        project: proj ? { id: proj.id, nome: proj.nome, cor: '' } : undefined,
      }
      setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t))
      toast('Tarefa atualizada', 'success')
    } else {
      toast('Erro ao salvar', 'error')
    }
    setEditSaving(false)
    setEditingTask(null)
  }

  async function toggleTaskStatus(task: Task) {
    const newStatus = task.status === 'co' ? 'ag' : 'co'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    if (newStatus === 'co') toast('Tarefa concluída!', 'success')
  }

  async function deleteTask(id: string) {
    if (!confirm('Excluir esta tarefa?')) return
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
    toast('Tarefa excluída', 'info')
  }

  function handleStartTimer(task: Task) {
    timer.startTimer(task.id, task.nome, task.project_id, userId)
    toast(`Timer iniciado: ${task.nome}`, 'success')
  }

  const filtered = filter === 't' ? tasks : tasks.filter(t => t.status === filter)
  const counts = {
    t: tasks.length,
    ag: tasks.filter(t => t.status === 'ag').length,
    an: tasks.filter(t => t.status === 'an').length,
    co: tasks.filter(t => t.status === 'co').length,
  }

  const iconBtnStyle = {
    background: 'none', border: '1px solid var(--b)', borderRadius: 6,
    padding: '7px 9px', cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
    color: 'var(--ts)', transition: 'all .15s', minHeight: 36,
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Tarefas</h1>
          <p>{counts.t} tarefas · {counts.co} concluídas</p>
        </div>
        <div className="page-header-actions">
          <button className="btn bs" onClick={() => openModal('timer')}>
            <Timer size={14} /> Iniciar timer
          </button>
          <button className="btn bp" onClick={() => openModal('create', task => setTasks(p => [task, ...p]))}>
            + Nova tarefa
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="tabs">
        {([['t', 'Todas'], ['ag', 'Aguardando'], ['an', 'Em andamento'], ['co', 'Concluídas']] as const).map(([val, label]) => (
          <button key={val} className={`tab-btn${filter === val ? ' active' : ''}`} onClick={() => setFilter(val)}>
            {label} <span style={{ fontSize: 11, background: 'var(--b)', borderRadius: 10, padding: '1px 7px', marginLeft: 4 }}>{counts[val]}</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Tarefa</th>
                <th className="table-mobile-hide">Projeto / Etapa</th>
                <th className="table-mobile-hide">Estimativa</th>
                <th className="table-mobile-hide">Horas reais</th>
                <th className="table-mobile-hide">Prioridade</th>
                <th>Status</th>
                <th className="table-mobile-hide">Prazo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><CheckCircle2 size={22} color="var(--o)" strokeWidth={1.5} /></div>
                      <div className="empty-state-title">Nenhuma tarefa aqui</div>
                      <div className="empty-state-sub">Crie uma tarefa e inicie o timer para registrar seu tempo</div>
                      <button className="btn bp btn-sm" onClick={() => openModal('create', task => setTasks(p => [task, ...p]))}>+ Nova tarefa</button>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(t => (
                <tr key={t.id} style={{ background: timer.taskId === t.id ? '#fdf9ff' : '' }}>
                  <td>
                    <input type="checkbox" checked={t.status === 'co'} onChange={() => toggleTaskStatus(t)}
                      style={{ cursor: 'pointer', accentColor: 'var(--p)', width: 16, height: 16 }} />
                  </td>
                  <td>
                    <div style={{
                      fontWeight: 500,
                      textDecoration: t.status === 'co' ? 'line-through' : 'none',
                      color: t.status === 'co' ? 'var(--ts)' : 'inherit',
                    }}>
                      {t.nome}
                    </div>
                    {timer.taskId === t.id && (
                      <div style={{ fontSize: 12, color: 'var(--o)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Timer size={11} /> Rodando
                      </div>
                    )}
                  </td>
                  <td className="table-mobile-hide">
                    {t.project ? <span className="tag">{(t.project as any).nome}</span> : '—'}
                    {t.etapa && <span style={{ fontSize: 12, color: 'var(--ts)', marginLeft: 6 }}>{t.etapa}</span>}
                  </td>
                  <td className="table-mobile-hide" style={{ fontSize: 13, color: 'var(--ts)' }}>
                    {(t.horas_est || t.minutos_est) ? `${t.horas_est || 0}h ${t.minutos_est || 0}m` : '—'}
                  </td>
                  <td className="table-mobile-hide" style={{ fontSize: 13, fontWeight: 600 }}>
                    {t.horas_real > 0 ? `${t.horas_real.toFixed(1)}h` : '—'}
                  </td>
                  <td className="table-mobile-hide"><PrioDot prio={t.prioridade} /></td>
                  <td>
                    <span className={`bdg ${t.status === 'co' ? 'bdg-g' : t.status === 'an' ? 'bdo' : 'bdgr'}`}>
                      {statusMap[t.status]}
                    </span>
                  </td>
                  <td className="table-mobile-hide" style={{ fontSize: 13, color: 'var(--ts)' }}>
                    {t.prazo ? t.prazo.split('-').reverse().join('/') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {t.status !== 'co' && timer.taskId !== t.id && (
                        <button className="btn bp btn-sm" onClick={() => handleStartTimer(t)} title="Iniciar timer">
                          <Timer size={12} />
                        </button>
                      )}
                      {t.status !== 'co' ? (
                        <button
                          style={{ ...iconBtnStyle, color: 'var(--g)', borderColor: 'var(--gl)' }}
                          onClick={() => toggleTaskStatus(t)}
                          title="Concluir tarefa"
                        >
                          <CheckCircle2 size={13} />
                        </button>
                      ) : (
                        <button
                          style={iconBtnStyle}
                          onClick={() => toggleTaskStatus(t)}
                          title="Reabrir tarefa"
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                      <button style={iconBtnStyle} onClick={() => openEdit(t)} title="Editar"><Pencil size={13} /></button>
                      <button style={{ ...iconBtnStyle, color: 'var(--r)', borderColor: 'var(--rl)' }} onClick={() => deleteTask(t.id)} title="Excluir"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal editar */}
      {editingTask && (
        <div className="modal-bg open" onClick={e => e.target === e.currentTarget && setEditingTask(null)}>
          <div className="modal-panel" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div className="modal-title">Editar tarefa</div>
              <button className="modal-close" onClick={() => setEditingTask(null)}><X size={14} /></button>
            </div>
            <div className="form-grid">
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Nome da tarefa *</label>
                <input className="form-input" value={editNome} onChange={e => setEditNome(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="form-label">Projeto</label>
                <select className="form-input" value={editProjectId} onChange={e => { setEditProjectId(e.target.value); setEditEtapa('') }}>
                  <option value="">— Sem projeto —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-input" value={editStatus} onChange={e => setEditStatus(e.target.value as typeof editStatus)}>
                  <option value="ag">Aguardando</option>
                  <option value="an">Em andamento</option>
                  <option value="co">Concluída</option>
                </select>
              </div>
              <div>
                <label className="form-label">Prioridade</label>
                <select className="form-input" value={editPrio} onChange={e => setEditPrio(e.target.value as typeof editPrio)}>
                  <option value="b">Baixa</option>
                  <option value="n">Normal</option>
                  <option value="a">Alta</option>
                </select>
              </div>
              {(projects.find(p => p.id === editProjectId)?.etapas || []).length > 0 && (
                <div>
                  <label className="form-label">Etapa do projeto</label>
                  <select className="form-input" value={editEtapa} onChange={e => setEditEtapa(e.target.value)}>
                    <option value="">— Sem etapa —</option>
                    {(projects.find(p => p.id === editProjectId)?.etapas || []).map((et: string) => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Estimativa</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" type="number" placeholder="0h" min="0" value={editHorasEst} onChange={e => setEditHorasEst(e.target.value)} style={{ width: 80 }} />
                  <input className="form-input" type="number" placeholder="0m" min="0" max="59" value={editMinutosEst} onChange={e => setEditMinutosEst(e.target.value)} style={{ width: 80 }} />
                </div>
              </div>
              <div>
                <label className="form-label">Prazo</label>
                <input className="form-input" type="date" value={editPrazo} onChange={e => setEditPrazo(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer end">
              <button className="btn bg-btn" onClick={() => setEditingTask(null)}>Cancelar</button>
              <button className="btn bp" onClick={saveEdit} disabled={editSaving || !editNome.trim()}>
                {editSaving ? 'Salvando...' : '✓ Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
