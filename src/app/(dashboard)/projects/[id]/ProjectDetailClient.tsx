'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Project, Task, TimeEntry, FinancialTransaction } from '@/lib/types'
import { fmtBRL, fmtDate, fmtSeconds } from '@/lib/types'
import { useTimer } from '@/lib/timer-context'
import { useToast } from '@/lib/toast-context'
import { useUI } from '@/lib/ui-context'
import {
  Timer, CheckCircle2, X, Pencil, TrendingUp, Receipt,
  AlertTriangle, Play, Plus, Clock, ChevronLeft,
} from 'lucide-react'

type Props = {
  userId: string
  project: Project & { client?: { id: string; nome: string; email?: string | null; whatsapp?: string | null } | null }
  initialTasks: Task[]
  timeEntries: TimeEntry[]
  transactions: FinancialTransaction[]
}

const ETAPAS_DEFAULT = ['Briefing', 'Criação', 'Revisão', 'Aprovação', 'Entrega']

const TABS = [
  { value: 'overview',    label: 'Visão geral' },
  { value: 'briefing',    label: 'Briefing' },
  { value: 'etapas',      label: 'Etapas' },
  { value: 'tarefas',     label: 'Tarefas' },
  { value: 'tempo',       label: 'Tempo' },
  { value: 'orcamento',   label: 'Orçamento' },
  { value: 'financeiro',  label: 'Financeiro' },
]

function PrioDot({ prio }: { prio: string }) {
  const color = prio === 'a' ? 'var(--r)' : prio === 'b' ? 'var(--g)' : 'var(--p)'
  return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
}

function EtapaTag({ nome }: { nome: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    'Briefing':    { bg: '#e0e7ff', color: '#3730a3' },
    'Criação':     { bg: '#fef3c7', color: '#92400e' },
    'Revisão':     { bg: '#fce7f3', color: '#9d174d' },
    'Aprovação':   { bg: '#d1fae5', color: '#065f46' },
    'Entrega':     { bg: '#ede9fe', color: '#5b21b6' },
    'Logotipo':    { bg: '#fef3c7', color: '#92400e' },
    'Descoberta':  { bg: '#dbeafe', color: '#1e40af' },
    'Conceituação':{ bg: '#e0e7ff', color: '#3730a3' },
  }
  const c = colors[nome] || { bg: 'var(--pl)', color: 'var(--p)' }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 500, background: c.bg, color: c.color, whiteSpace: 'nowrap',
    }}>{nome}</span>
  )
}

export default function ProjectDetailClient({ userId, project, initialTasks, timeEntries, transactions }: Props) {
  const supabase = createClient()
  const timer = useTimer()
  const { toast } = useToast()
  const { openModal } = useUI()

  const [tab, setTab] = useState('overview')
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [etapaAtual, setEtapaAtual] = useState(project.etapa_atual)
  const [status, setStatus] = useState(project.status)
  const [taskFilter, setTaskFilter] = useState<'t' | 'an' | 'ag' | 'co'>('t')

  // Edit project modal
  const [editModal, setEditModal] = useState(false)
  const [editNome, setEditNome] = useState(project.nome)
  const [editDescricao, setEditDescricao] = useState(project.descricao || '')
  const [editValor, setEditValor] = useState(project.valor?.toString() || '')
  const [editHorasEst, setEditHorasEst] = useState(project.horas_est?.toString() || '')
  const [editPrazo, setEditPrazo] = useState(project.data_prazo || '')
  const [editCor, setEditCor] = useState(project.cor || '#5413A0')
  const [editPrio, setEditPrio] = useState<'baixa'|'normal'|'alta'>((project.prioridade as any) || 'normal')
  const [editSaving, setEditSaving] = useState(false)
  const [projNome, setProjNome] = useState(project.nome)

  // Inline task add
  const [taskNome, setTaskNome] = useState('')
  const [taskEtapa, setTaskEtapa] = useState(etapaAtual)
  const [taskPrio, setTaskPrio] = useState<'b'|'n'|'a'>('n')
  const [showTaskRow, setShowTaskRow] = useState(false)
  const [taskSaving, setTaskSaving] = useState(false)

  const etapas: string[] = project.etapas?.length ? project.etapas : ETAPAS_DEFAULT
  const etapaIdx = etapas.indexOf(etapaAtual)

  // Derived stats
  const totalSec = timeEntries.reduce((s, te) => s + (te.segundos || 0), 0)
  const totalHoras = totalSec / 3600
  const horasEst = project.horas_est || 0
  const progresso = horasEst > 0 ? Math.min(Math.round((totalHoras / horasEst) * 100), 100) : 0
  const concluidas = tasks.filter(t => t.status === 'co').length
  const emAndamento = tasks.filter(t => t.status === 'an').length
  const diasRestantes = project.data_prazo
    ? Math.max(0, Math.ceil((new Date(project.data_prazo).getTime() - Date.now()) / 86400000))
    : null
  const totalRecebido = transactions.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0)
  const totalDespesas = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const taxaHoraReal = totalHoras > 0 ? project.valor / totalHoras : 0
  const taxaHoraMin = horasEst > 0 ? project.valor / horasEst : 0
  const acimaMeta = taxaHoraReal >= taxaHoraMin && taxaHoraReal > 0

  // By etapa stats
  const tasksByEtapa = (et: string) => tasks.filter(t => t.etapa === et)
  const horasByEtapa = (et: string) => {
    const tIds = tasksByEtapa(et).map(t => t.id)
    return timeEntries.filter(te => tIds.includes(te.task_id || '')).reduce((s, te) => s + te.segundos, 0) / 3600
  }
  const estByEtapa = (et: string) => tasksByEtapa(et).reduce((s, t) => s + (t.horas_est || 0) + (t.minutos_est || 0) / 60, 0)
  const etapaStatus = (et: string, i: number): 'concluida' | 'ativa' | 'aguardando' => {
    if (i < etapaIdx) return 'concluida'
    if (i === etapaIdx) return 'ativa'
    return 'aguardando'
  }

  const filteredTasks = taskFilter === 't' ? tasks : tasks.filter(t => t.status === taskFilter)

  async function saveEditProject() {
    if (!editNome.trim()) return
    setEditSaving(true)
    await supabase.from('projects').update({
      nome: editNome.trim(), descricao: editDescricao || null,
      valor: parseFloat(editValor) || 0, horas_est: parseFloat(editHorasEst) || 0,
      data_prazo: editPrazo || null, cor: editCor, prioridade: editPrio,
    }).eq('id', project.id)
    setProjNome(editNome.trim())
    setEditSaving(false); setEditModal(false)
    toast('Projeto atualizado', 'success')
  }

  async function avancarEtapa() {
    const next = etapas[etapaIdx + 1]
    if (!next) return
    await supabase.from('projects').update({ etapa_atual: next }).eq('id', project.id)
    setEtapaAtual(next)
    toast(`Etapa avançada para ${next}`, 'success')
  }

  async function changeStatus(s: string) {
    await supabase.from('projects').update({ status: s }).eq('id', project.id)
    setStatus(s as typeof status)
  }

  async function addTask() {
    if (!taskNome.trim()) return
    setTaskSaving(true)
    const { data } = await supabase.from('tasks').insert({
      user_id: userId, project_id: project.id,
      nome: taskNome.trim(), prioridade: taskPrio,
      etapa: taskEtapa, status: 'ag',
    }).select('*').single()
    if (data) { setTasks(p => [...p, data as Task]); toast('Tarefa criada', 'success') }
    setTaskNome(''); setShowTaskRow(false); setTaskSaving(false)
  }

  async function toggleTask(task: Task) {
    const ns = task.status === 'co' ? 'ag' : 'co'
    await supabase.from('tasks').update({ status: ns }).eq('id', task.id)
    setTasks(p => p.map(t => t.id === task.id ? { ...t, status: ns } : t))
    if (ns === 'co') toast('Tarefa concluída!', 'success')
  }

  function startTimerForTask(task: Task) {
    timer.startTimer(task.id, task.nome, project.id, userId)
    toast(`Timer iniciado: ${task.nome}`, 'success')
  }

  const statusBadge = {
    andamento: { label: 'Em andamento', bg: 'var(--ol)', color: 'var(--oh)' },
    pausado:   { label: 'Pausado',       bg: '#e5e7eb', color: '#374151' },
    concluido: { label: 'Concluído',     bg: 'var(--gl)', color: '#157040' },
    cancelado: { label: 'Cancelado',     bg: 'var(--rl)', color: 'var(--r)' },
  }[status] || { label: status, bg: 'var(--b)', color: 'var(--ts)' }

  return (
    <div>
      <style>{`
        .pd-overview-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
        @media (max-width: 900px) {
          .pd-overview-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      {/* ── TOP BAR ─────────────────────────────── */}
      <div style={{
        padding: '12px var(--page-px)', borderBottom: '1px solid var(--bd)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
        background: '#fff', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link href="/projects" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 13, color: 'var(--ts)', textDecoration: 'none',
              padding: '4px 10px', borderRadius: 6, border: '1px solid var(--bd)', background: 'var(--s)',
            }}>
              <ChevronLeft size={13} /> Projetos
            </Link>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{projNome}</span>
            {project.client && (
              <span style={{ fontSize: 14, color: 'var(--ts)' }}>· {project.client.nome}</span>
            )}
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: statusBadge.bg, color: statusBadge.color,
            }}>{statusBadge.label}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ts)', display: 'flex', gap: 12 }}>
            {project.data_prazo && <span>Prazo: {fmtDate(project.data_prazo)}</span>}
            {project.valor > 0 && <span>· {fmtBRL(project.valor)}</span>}
            {horasEst > 0 && <span>· {horasEst}h estimadas</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn bs" onClick={() => openModal('timer')}>
            <Timer size={13} /> Iniciar timer
          </button>
          <button className="btn bp" onClick={() => setEditModal(true)}>
            <Plus size={13} /> Editar projeto
          </button>
        </div>
      </div>

      {/* ── TABS ────────────────────────────────── */}
      <div style={{ padding: '0 var(--page-px)', borderBottom: '1px solid var(--bd)', background: '#fff' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.value} className={`tab-btn${tab === t.value ? ' active' : ''}`}
              onClick={() => setTab(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page">

        {/* ══ VISÃO GERAL ══════════════════════════ */}
        {tab === 'overview' && (
          <div className="pd-overview-grid">
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Progresso */}
              <div className="card">
                <div className="card-body">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Progresso geral</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, color: 'var(--p)', lineHeight: 1 }}>{progresso}%</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 10, borderRadius: 6, background: 'var(--b)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 6, background: 'var(--p)', width: `${progresso}%`, transition: 'width .5s' }} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ts)', marginTop: 6 }}>
                        {totalHoras.toFixed(1)}h registradas de {horasEst}h estimadas
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                    {[
                      { val: concluidas, label: 'Concluídas' },
                      { val: emAndamento, label: 'Em andamento' },
                      { val: diasRestantes !== null ? diasRestantes : '—', label: 'Dias restantes' },
                    ].map(({ val, label }) => (
                      <div key={label} style={{ textAlign: 'center', padding: '14px 8px', background: 'var(--s)', borderRadius: 10 }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--p)' }}>{val}</div>
                        <div style={{ fontSize: 12, color: 'var(--ts)', marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Etapas resumo */}
              <div className="card">
                <div className="card-body">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Etapas</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {etapas.map((et, i) => {
                      const est = etapaStatus(et, i)
                      const pct = est === 'concluida' ? 100 : est === 'ativa' ? Math.min(Math.round((horasByEtapa(et) / Math.max(estByEtapa(et), 0.1)) * 100), 100) : 0
                      return (
                        <div key={et} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: est === 'concluida' ? 'var(--g)' : est === 'ativa' ? 'var(--p)' : 'var(--b)',
                          }} />
                          <div style={{ flex: 1, fontSize: 14 }}>{i + 1}. {et}</div>
                          <div style={{ width: 100, height: 4, borderRadius: 3, background: 'var(--b)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: est === 'concluida' ? 'var(--g)' : 'var(--p)' }} />
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                            background: est === 'concluida' ? 'var(--gl)' : est === 'ativa' ? 'var(--ol)' : 'var(--b)',
                            color: est === 'concluida' ? '#157040' : est === 'ativa' ? 'var(--oh)' : 'var(--ts)',
                          }}>
                            {est === 'concluida' ? 'Concluída' : est === 'ativa' ? 'Em andamento' : 'Aguardando'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {etapaIdx < etapas.length - 1 && (
                    <button className="btn bp btn-sm" onClick={avancarEtapa} style={{ marginTop: 16 }}>
                      Avançar para {etapas[etapaIdx + 1]} →
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Rentabilidade */}
              <div className="card">
                <div className="card-body">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Rentabilidade</div>
                  {[
                    { label: 'Valor do projeto', val: fmtBRL(project.valor), color: 'inherit' },
                    { label: 'Taxa hora real', val: taxaHoraReal > 0 ? `${fmtBRL(taxaHoraReal)}/h` : '—', color: 'var(--g)' },
                    { label: 'Taxa hora mínima', val: taxaHoraMin > 0 ? `${fmtBRL(taxaHoraMin)}/h` : '—', color: 'var(--ts)' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bd)' }}>
                      <span style={{ fontSize: 13, color: 'var(--ts)' }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.val}</span>
                    </div>
                  ))}
                  <div style={{
                    marginTop: 14, padding: '8px 12px', borderRadius: 8,
                    background: acimaMeta ? 'var(--gl)' : 'var(--rl)',
                    color: acimaMeta ? '#157040' : 'var(--r)',
                    fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {acimaMeta ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {acimaMeta ? 'Acima da meta' : 'Abaixo da meta'}
                  </div>
                </div>
              </div>

              {/* Alertas */}
              {horasEst > 0 && totalHoras > horasEst * 0.8 && (
                <div className="card" style={{ border: '1px solid rgba(242,140,40,.3)', background: 'rgba(242,140,40,.04)' }}>
                  <div className="card-body">
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Alertas</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <AlertTriangle size={16} color="var(--o)" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Ritmo acima do estimado</div>
                        <div style={{ fontSize: 12, color: 'var(--ts)' }}>
                          {totalHoras >= horasEst
                            ? `Você já ultrapassou o estimado em ${(totalHoras - horasEst).toFixed(1)}h.`
                            : `Se mantiver o ritmo pode extrapolar em ${(horasEst - totalHoras).toFixed(1)}h.`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Iniciar timer */}
              <button
                className="btn bp"
                onClick={() => openModal('timer')}
                style={{ width: '100%', padding: 16, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Timer size={15} /> Iniciar timer neste projeto
              </button>
            </div>
          </div>
        )}

        {/* ══ BRIEFING ═════════════════════════════ */}
        {tab === 'briefing' && (
          <div style={{ maxWidth: 640 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Briefing</span>
                <button className="btn bg-btn btn-sm" onClick={() => setEditModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Pencil size={12} /> Editar
                </button>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {project.descricao ? (
                  <>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ts)', marginBottom: 8 }}>OBJETIVO</div>
                      <div style={{ fontSize: 14, lineHeight: 1.7 }}>{project.descricao}</div>
                    </div>
                    {project.client && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ts)', marginBottom: 8 }}>CLIENTE</div>
                        <div style={{ fontSize: 14 }}>{project.client.nome}</div>
                        {project.client.email && <div style={{ fontSize: 13, color: 'var(--ts)' }}>{project.client.email}</div>}
                        {project.client.whatsapp && (
                          <a href={`https://wa.me/55${project.client.whatsapp.replace(/\D/g,'')}`} target="_blank" style={{ fontSize: 13, color: 'var(--g)', textDecoration: 'none' }}>
                            WhatsApp →
                          </a>
                        )}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ts)', marginBottom: 8 }}>APROVAÇÃO</div>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: 'var(--gl)', color: '#157040', fontSize: 13, fontWeight: 500 }}>
                        {project.prioridade === 'alta' ? 'Aprovação rápida' : 'Aprovação padrão'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Pencil size={20} color="var(--o)" strokeWidth={1.5} /></div>
                    <div className="empty-state-title">Briefing não preenchido</div>
                    <div className="empty-state-sub">Adicione a descrição e objetivo do projeto</div>
                    <button className="btn bp btn-sm" onClick={() => setEditModal(true)}>Preencher briefing</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ ETAPAS ═══════════════════════════════ */}
        {tab === 'etapas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {etapas.map((et, i) => {
              const est = etapaStatus(et, i)
              const tEt = tasksByEtapa(et)
              const hEt = horasByEtapa(et)
              const eEt = estByEtapa(et)
              const pct = est === 'concluida' ? 100 : eEt > 0 ? Math.min(Math.round((hEt / eEt) * 100), 100) : 0
              return (
                <div key={et} className="card" style={{
                  border: est === 'ativa' ? '2px solid var(--p)' : '1px solid var(--bd)',
                }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Circle */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: est === 'concluida' ? 'var(--g)' : est === 'ativa' ? 'var(--p)' : 'var(--b)',
                        color: est !== 'aguardando' ? '#fff' : 'var(--ts)',
                        fontSize: 15, fontWeight: 800,
                      }}>
                        {est === 'concluida' ? <CheckCircle2 size={18} /> : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{i + 1}. {et}</div>
                        <div style={{ fontSize: 12, color: 'var(--ts)', marginTop: 2 }}>
                          {tEt.length} tarefa{tEt.length !== 1 ? 's' : ''}
                          {eEt > 0 && ` · ${eEt.toFixed(0)}h estimadas`}
                          {hEt > 0 && ` · ${hEt.toFixed(1)}h registradas`}
                        </div>
                        {est === 'ativa' && (
                          <div style={{ marginTop: 8, height: 4, borderRadius: 3, background: 'var(--b)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: 'var(--p)', width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: est === 'concluida' ? 'var(--gl)' : est === 'ativa' ? 'var(--ol)' : 'var(--b)',
                        color: est === 'concluida' ? '#157040' : est === 'ativa' ? 'var(--oh)' : 'var(--ts)',
                      }}>
                        {est === 'concluida' ? 'Concluída' : est === 'ativa' ? 'Ativa' : 'Aguardando'}
                      </span>
                      {est === 'ativa' && i < etapas.length - 1 && (
                        <button className="btn bp btn-sm" onClick={avancarEtapa}>Concluir etapa</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══ TAREFAS ══════════════════════════════ */}
        {tab === 'tarefas' && (
          <div className="card">
            {/* Sub-tabs */}
            <div style={{ padding: '0 12px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <div style={{ display: 'flex', gap: 0, overflow: 'auto', scrollbarWidth: 'none' }}>
                {([['t','Todas'],['an','Em andamento'],['ag','Aguardando'],['co','Concluídas']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setTaskFilter(v)} className={`tab-btn${taskFilter === v ? ' active' : ''}`}
                    style={{ fontSize: 12, padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {l}
                  </button>
                ))}
              </div>
              <button className="btn bp btn-sm" onClick={() => setShowTaskRow(true)} style={{ flexShrink: 0 }}>
                <Plus size={12} /> Nova
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Tarefa</th>
                    <th>Etapa</th>
                    <th>Est.</th>
                    <th>Reg.</th>
                    <th>Prior.</th>
                    <th>Status</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 && !showTaskRow && (
                    <tr><td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-state-icon"><CheckCircle2 size={22} color="var(--o)" strokeWidth={1.5} /></div>
                        <div className="empty-state-title">Nenhuma tarefa</div>
                        <div className="empty-state-sub">Adicione tarefas para organizar o trabalho deste projeto</div>
                        <button className="btn bp btn-sm" onClick={() => setShowTaskRow(true)}>+ Nova tarefa</button>
                      </div>
                    </td></tr>
                  )}
                  {filteredTasks.map(t => (
                    <tr key={t.id}>
                      <td>
                        <input type="checkbox" checked={t.status === 'co'} onChange={() => toggleTask(t)}
                          style={{ cursor: 'pointer', accentColor: 'var(--p)', width: 16, height: 16 }} />
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, textDecoration: t.status === 'co' ? 'line-through' : 'none', color: t.status === 'co' ? 'var(--ts)' : 'inherit' }}>
                          {t.nome}
                        </div>
                      </td>
                      <td>{t.etapa ? <EtapaTag nome={t.etapa} /> : '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--ts)' }}>
                        {(t.horas_est || t.minutos_est) ? `${t.horas_est || 0}h${t.minutos_est ? ` ${t.minutos_est}m` : ''}` : '—'}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--ts)' }}>
                        {t.horas_real > 0 ? `${t.horas_real.toFixed(1)}h` : '—'}
                      </td>
                      <td><PrioDot prio={t.prioridade} /></td>
                      <td>
                        <span className={`bdg ${t.status === 'co' ? 'bdg-g' : t.status === 'an' ? 'bdo' : 'bdgr'}`}>
                          {t.status === 'co' ? 'Concluída' : t.status === 'an' ? 'Em andamento' : 'Aguardando'}
                        </span>
                      </td>
                      <td>
                        {t.status !== 'co' && timer.taskId !== t.id && (
                          <button className="btn bp btn-sm" onClick={() => startTimerForTask(t)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Play size={10} /> Timer
                          </button>
                        )}
                        {timer.taskId === t.id && (
                          <span style={{ fontSize: 11, color: 'var(--o)', fontWeight: 700 }}>● Rodando</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Inline add row */}
                  {showTaskRow && (
                    <tr>
                      <td></td>
                      <td>
                        <input className="form-input" placeholder="Nome da tarefa" value={taskNome}
                          onChange={e => setTaskNome(e.target.value)} autoFocus
                          onKeyDown={e => e.key === 'Enter' && addTask()} style={{ padding: '6px 10px', fontSize: 13 }} />
                      </td>
                      <td>
                        <select className="form-input" value={taskEtapa} onChange={e => setTaskEtapa(e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }}>
                          {etapas.map(et => <option key={et} value={et}>{et}</option>)}
                        </select>
                      </td>
                      <td></td><td></td>
                      <td>
                        <select className="form-input" value={taskPrio} onChange={e => setTaskPrio(e.target.value as 'b'|'n'|'a')} style={{ padding: '6px 8px', fontSize: 13 }}>
                          <option value="b">Baixa</option>
                          <option value="n">Normal</option>
                          <option value="a">Alta</option>
                        </select>
                      </td>
                      <td></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn bp btn-sm" onClick={addTask} disabled={taskSaving || !taskNome.trim()}>✓</button>
                          <button className="btn bg-btn btn-sm" onClick={() => setShowTaskRow(false)}><X size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--ts)' }}>{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} · {concluidas} concluída{concluidas !== 1 ? 's' : ''}</span>
              <button className="btn bg-btn btn-sm" onClick={() => setShowTaskRow(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Plus size={12} /> Adicionar tarefa
              </button>
            </div>
          </div>
        )}

        {/* ══ TEMPO ════════════════════════════════ */}
        {tab === 'tempo' && (
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Total: <strong>{Math.floor(totalHoras)}h {Math.round((totalHoras % 1) * 60)}m</strong>
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn bs btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Plus size={12} /> Sessão manual
                </button>
                <button className="btn bp btn-sm" onClick={() => openModal('timer')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Timer size={12} /> Timer
                </button>
              </div>
            </div>
            <div className="card-body">
              {timeEntries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Clock size={22} color="var(--o)" strokeWidth={1.5} /></div>
                  <div className="empty-state-title">Nenhum registro de tempo</div>
                  <div className="empty-state-sub">Inicie o timer em uma tarefa deste projeto para registrar as horas</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {timeEntries.map(te => {
                    const ini = te.iniciado_em ? new Date(te.iniciado_em) : null
                    const fim = te.finalizado_em ? new Date(te.finalizado_em) : null
                    const fmtHM = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
                    const isToday = ini && new Date().toDateString() === ini.toDateString()
                    const label = ini ? (isToday ? 'Hoje' : fmtDate(te.data)) : fmtDate(te.data)
                    const range = ini && fim ? `${fmtHM(ini)}–${fmtHM(fim)}` : ''
                    return (
                      <div key={te.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--bd)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--p)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{te.descricao || 'Sessão de trabalho'}</div>
                          <div style={{ fontSize: 12, color: 'var(--ts)', marginTop: 2 }}>{label}{range ? ` · ${range}` : ''}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--p)' }}>
                          {Math.floor(te.segundos / 3600)}h {Math.floor((te.segundos % 3600) / 60)}m
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ORÇAMENTO ════════════════════════════ */}
        {tab === 'orcamento' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-body">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Resumo financeiro</div>
                {[
                  { label: 'Valor do projeto', val: fmtBRL(project.valor), color: 'inherit' },
                  { label: 'Total recebido', val: fmtBRL(totalRecebido), color: 'var(--g)' },
                  { label: 'Despesas', val: fmtBRL(totalDespesas), color: 'var(--r)' },
                  { label: 'Saldo', val: fmtBRL(totalRecebido - totalDespesas), color: totalRecebido - totalDespesas >= 0 ? 'var(--g)' : 'var(--r)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--bd)' }}>
                    <span style={{ fontSize: 14, color: 'var(--ts)' }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Horas</div>
                {[
                  { label: 'Horas estimadas', val: `${horasEst}h` },
                  { label: 'Horas registradas', val: `${totalHoras.toFixed(1)}h` },
                  { label: 'Taxa real (R$/h)', val: taxaHoraReal > 0 ? fmtBRL(taxaHoraReal) : '—' },
                  { label: 'Taxa mínima (R$/h)', val: taxaHoraMin > 0 ? fmtBRL(taxaHoraMin) : '—' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--bd)' }}>
                    <span style={{ fontSize: 14, color: 'var(--ts)' }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ FINANCEIRO ═══════════════════════════ */}
        {tab === 'financeiro' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Transações do projeto</span>
              <Link href="/financial" className="btn bp btn-sm">+ Registrar</Link>
            </div>
            <div className="card-body">
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Receipt size={22} color="var(--o)" strokeWidth={1.5} /></div>
                  <div className="empty-state-title">Nenhuma transação</div>
                  <div className="empty-state-sub">Vincule recebimentos e despesas para acompanhar a rentabilidade</div>
                  <Link href="/financial" className="btn bp btn-sm">+ Registrar</Link>
                </div>
              ) : (
                transactions.map(t => (
                  <div key={t.id} className="fin-row">
                    <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: t.tipo === 'entrada' ? 'var(--gl)' : 'var(--rl)' }}>
                      {t.tipo === 'entrada' ? <TrendingUp size={16} color="var(--g)" /> : <Receipt size={16} color="var(--r)" />}
                    </div>
                    <div className="fin-row-content">
                      <div className="fin-row-title">{t.descricao || (t.tipo === 'entrada' ? 'Recebimento' : 'Despesa')}</div>
                      <div className="fin-row-sub">{t.data ? fmtDate(t.data) : '—'}</div>
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

      {/* ══ EDIT MODAL ═══════════════════════════ */}
      {editModal && (
        <div className="modal-bg open" onClick={e => e.target === e.currentTarget && setEditModal(false)}>
          <div className="modal-panel" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div className="modal-title">Editar projeto</div>
              <button className="modal-close" onClick={() => setEditModal(false)}><X size={14} /></button>
            </div>
            <div className="form-grid">
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Nome do projeto *</label>
                <input className="form-input" value={editNome} onChange={e => setEditNome(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="form-label">Valor (R$)</label>
                <input className="form-input" type="number" min="0" value={editValor} onChange={e => setEditValor(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Horas estimadas</label>
                <input className="form-input" type="number" min="0" value={editHorasEst} onChange={e => setEditHorasEst(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Prazo</label>
                <input className="form-input" type="date" value={editPrazo} onChange={e => setEditPrazo(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-input" value={status} onChange={e => changeStatus(e.target.value)}>
                  <option value="andamento">Em andamento</option>
                  <option value="pausado">Pausado</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="form-label">Cor</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {['#5413A0','#F28C28','#18A058','#D94040','#3b5bdb','#e67e22'].map(c => (
                    <div key={c} onClick={() => setEditCor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: editCor === c ? '3px solid var(--t)' : '3px solid transparent' }} />
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Descrição / Objetivo</label>
                <textarea className="form-input" rows={4} value={editDescricao} onChange={e => setEditDescricao(e.target.value)} placeholder="Descreva o objetivo e escopo do projeto..." />
              </div>
            </div>
            <div className="modal-footer end">
              <button className="btn bg-btn" onClick={() => setEditModal(false)}>Cancelar</button>
              <button className="btn bp" onClick={saveEditProject} disabled={editSaving || !editNome.trim()}>
                {editSaving ? 'Salvando...' : '✓ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
