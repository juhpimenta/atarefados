'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useUI } from '@/lib/ui-context'
import { useTimer } from '@/lib/timer-context'
import { useToast } from '@/lib/toast-context'
import type { Task, Project } from '@/lib/types'
import { X, Timer, Sparkles, Search, Play } from 'lucide-react'

type Props = {
  userId: string
  projects: Pick<Project, 'id' | 'nome' | 'etapas'>[]
}

type Estimate = { horas: number; minutos: number; baseadoEm: number } | null

export default function QuickTaskModal({ userId, projects }: Props) {
  const { modalOpen, modalMode, onCreated, closeModal, openModal } = useUI()
  const timer = useTimer()
  const { toast } = useToast()
  const supabase = createClient()

  // create mode state
  const [nome, setNome] = useState('')
  const [projectId, setProjectId] = useState('')
  const [etapa, setEtapa] = useState('')
  const [prio, setPrio] = useState<'b' | 'n' | 'a'>('n')
  const [prazo, setPrazo] = useState('')
  const [estimate, setEstimate] = useState<Estimate>(null)
  const [estimating, setEstimating] = useState(false)
  const [saving, setSaving] = useState(false)

  // timer mode state
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Task[]>([])
  const [searching, setSearching] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const searchRef = useRef<NodeJS.Timeout | null>(null)

  // reset on open
  useEffect(() => {
    if (modalOpen) {
      setNome(''); setProjectId(''); setEtapa(''); setPrio('n'); setPrazo('')
      setEstimate(null); setSaving(false); setSearch(''); setSearchResults([])
    }
  }, [modalOpen])

  // Real-time estimate
  useEffect(() => {
    if (modalMode !== 'create') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (nome.trim().length < 3 && !projectId) { setEstimate(null); return }

    debounceRef.current = setTimeout(async () => {
      setEstimating(true)
      try {
        const res = await fetch('/api/estimate-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome.trim(), projectId: projectId || undefined }),
        })
        setEstimate(res.ok ? await res.json() : null)
      } catch { setEstimate(null) }
      setEstimating(false)
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [nome, projectId, modalMode])

  // Task search (timer mode)
  useEffect(() => {
    if (modalMode !== 'timer') return
    if (searchRef.current) clearTimeout(searchRef.current)
    if (search.trim().length < 2) { setSearchResults([]); return }

    searchRef.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('tasks')
        .select('*, project:projects(id, nome, cor)')
        .eq('user_id', userId)
        .neq('status', 'co')
        .ilike('nome', `%${search.trim()}%`)
        .limit(8)
      setSearchResults((data as Task[]) || [])
      setSearching(false)
    }, 300)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [search, modalMode, userId, supabase])

  const selectedProject = projects.find(p => p.id === projectId)
  const etapas = selectedProject?.etapas || []

  async function handleSave(startTimer: boolean) {
    if (!nome.trim()) return
    setSaving(true)
    const horas_est = estimate?.horas ?? 0
    const minutos_est = estimate?.minutos ?? 0
    const { data, error } = await supabase.from('tasks').insert({
      user_id: userId,
      nome: nome.trim(),
      project_id: projectId || null,
      status: 'ag',
      prioridade: prio,
      etapa: etapa || null,
      horas_est,
      minutos_est,
      prazo: prazo || null,
    }).select('*').single()

    if (error || !data) {
      toast(`Erro ao criar tarefa: ${error?.message || 'desconhecido'}`, 'error')
      setSaving(false)
      return
    }

    const proj = projectId ? projects.find(p => p.id === projectId) : null
    const task: Task = {
      ...data,
      project: proj ? { id: proj.id, nome: proj.nome, cor: '' } : undefined,
    }
    onCreated?.(task)
    toast('Tarefa criada!', 'success')

    if (startTimer) {
      timer.startTimer(task.id, task.nome, task.project_id, userId)
      toast('Timer iniciado', 'info')
    }

    closeModal()
    setSaving(false)
  }

  function handleStartExisting(task: Task) {
    timer.startTimer(task.id, task.nome, task.project_id ?? null, userId)
    toast(`Timer iniciado: ${task.nome}`, 'success')
    closeModal()
  }

  if (!modalOpen) return null

  return (
    <div
      className="modal-bg open"
      onClick={e => e.target === e.currentTarget && closeModal()}
      style={{ zIndex: 500 }}
    >
      <div className="modal-panel" style={{ maxWidth: 520, width: '100%' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Timer size={16} color="var(--o)" />
            {modalMode === 'create' ? 'Nova tarefa' : 'Iniciar timer'}
          </div>
          <button className="modal-close" onClick={closeModal}><X size={14} /></button>
        </div>

        {modalMode === 'create' ? (
          <div>
            {/* Nome */}
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Nome da tarefa *</label>
              <input
                className="form-input"
                placeholder="Ex: Criar layout da home"
                value={nome}
                onChange={e => setNome(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && !saving && handleSave(false)}
              />
            </div>

            {/* Estimativa inteligente */}
            <div style={{
              borderRadius: 10, padding: '10px 14px', marginBottom: 14,
              background: estimate ? 'var(--ol)' : 'var(--b)',
              border: `1px solid ${estimate ? 'var(--o)' : 'var(--bd)'}`,
              display: 'flex', alignItems: 'center', gap: 10, minHeight: 44,
              transition: 'all .3s',
            }}>
              <Sparkles size={14} color={estimate ? 'var(--oh)' : 'var(--ts)'} />
              {estimating ? (
                <span style={{ fontSize: 13, color: 'var(--ts)' }}>Calculando estimativa...</span>
              ) : estimate ? (
                <span style={{ fontSize: 13, color: 'var(--oh)', fontWeight: 500 }}>
                  Estimativa: <strong>{estimate.horas}h {estimate.minutos}m</strong>
                  <span style={{ fontWeight: 400, color: 'var(--ts)', marginLeft: 6 }}>
                    · baseado em {estimate.baseadoEm} tarefa{estimate.baseadoEm !== 1 ? 's' : ''} similar{estimate.baseadoEm !== 1 ? 'es' : ''}
                  </span>
                </span>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--ts)' }}>
                  {nome.trim().length >= 3 ? 'Sem histórico para estimar' : 'Preencha o nome para ver a estimativa'}
                </span>
              )}
            </div>

            {/* Grid */}
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div>
                <label className="form-label">Projeto</label>
                <select className="form-input" value={projectId} onChange={e => { setProjectId(e.target.value); setEtapa('') }}>
                  <option value="">— Sem projeto —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Prioridade</label>
                <select className="form-input" value={prio} onChange={e => setPrio(e.target.value as typeof prio)}>
                  <option value="b">Baixa</option>
                  <option value="n">Normal</option>
                  <option value="a">Alta</option>
                </select>
              </div>
              {etapas.length > 0 && (
                <div>
                  <label className="form-label">Etapa</label>
                  <select className="form-input" value={etapa} onChange={e => setEtapa(e.target.value)}>
                    <option value="">— Sem etapa —</option>
                    {etapas.map((et: string) => <option key={et} value={et}>{et}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Prazo</label>
                <input className="form-input" type="date" value={prazo} onChange={e => setPrazo(e.target.value)} />
              </div>
            </div>

            {/* Actions */}
            <div className="modal-footer end">
              <button className="btn bg-btn" onClick={closeModal}>Cancelar</button>
              <button className="btn bs" onClick={() => handleSave(false)} disabled={saving || !nome.trim()}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button className="btn bp" onClick={() => handleSave(true)} disabled={saving || !nome.trim()}>
                <Timer size={13} /> Salvar e iniciar
              </button>
            </div>
          </div>
        ) : (
          /* Timer mode — search existing tasks */
          <div>
            <div style={{ marginBottom: 14, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ts)', pointerEvents: 'none' }} />
              <input
                className="form-input"
                placeholder="Buscar tarefa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                style={{ paddingLeft: 36 }}
              />
            </div>

            {searching && <div style={{ textAlign: 'center', color: 'var(--ts)', fontSize: 13, padding: 24 }}>Buscando...</div>}

            {!searching && search.length >= 2 && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--ts)', fontSize: 13, padding: 24 }}>
                Nenhuma tarefa encontrada
              </div>
            )}

            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {searchResults.map(t => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 10,
                      border: '1px solid var(--bd)', cursor: 'pointer',
                      background: 'var(--s)', transition: 'all .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--o)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
                    onClick={() => handleStartExisting(t)}
                  >
                    {t.project && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: (t.project as any).cor || 'var(--p)',
                      }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nome}</div>
                      {t.project && <div style={{ fontSize: 12, color: 'var(--ts)' }}>{(t.project as any).nome}</div>}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleStartExisting(t) }}
                      style={{
                        background: 'var(--p)', color: '#fff', border: 'none',
                        borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                      }}
                    >
                      <Play size={11} /> Iniciar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {search.length < 2 && (
              <div style={{ textAlign: 'center', color: 'var(--ts)', fontSize: 13, padding: '16px 0' }}>
                Digite pelo menos 2 caracteres para buscar
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--ts)' }}>Ou crie uma nova tarefa</span>
              <button className="btn bp btn-sm" onClick={() => openModal('create')}>
                + Nova tarefa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
