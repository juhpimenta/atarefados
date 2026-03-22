'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Project, Client } from '@/lib/types'
import { fmtBRL, fmtDate } from '@/lib/types'

type Props = {
  userId: string
  initialProjects: Project[]
  clients: Pick<Client, 'id' | 'nome'>[]
}

const ETAPAS_DEFAULT = ['Briefing', 'Criação', 'Revisão', 'Aprovação', 'Entrega']
const statusColors: Record<string, string> = {
  andamento: 'bdo', pausado: 'bdy', concluido: 'bdg-g', cancelado: 'bdr',
}
const statusLabels: Record<string, string> = {
  andamento: 'Em andamento', pausado: 'Pausado', concluido: 'Concluído', cancelado: 'Cancelado',
}

export default function ProjectsClient({ userId, initialProjects, clients }: Props) {
  const supabase = createClient()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'todos' | 'andamento' | 'concluido'>('todos')

  // Form
  const [nome, setNome] = useState('')
  const [clientId, setClientId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [horasEst, setHorasEst] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataPrazo, setDataPrazo] = useState('')
  const [prioridade, setPrioridade] = useState<'baixa' | 'normal' | 'alta'>('normal')
  const [cor, setCor] = useState('#5413A0')

  function openModal() {
    setNome(''); setClientId(''); setDescricao(''); setValor(''); setHorasEst('')
    setDataInicio(''); setDataPrazo(''); setPrioridade('normal'); setCor('#5413A0')
    setModal(true)
  }

  async function saveProject() {
    if (!nome.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('projects').insert({
      user_id: userId,
      nome: nome.trim(),
      client_id: clientId || null,
      descricao: descricao || null,
      valor: parseFloat(valor) || 0,
      horas_est: parseFloat(horasEst) || 0,
      data_inicio: dataInicio || null,
      data_prazo: dataPrazo || null,
      prioridade,
      cor,
      etapas: ETAPAS_DEFAULT,
      etapa_atual: 'Briefing',
    }).select('*, client:clients(id, nome)').single()

    if (!error && data) {
      setProjects(prev => [data as Project, ...prev])
      setModal(false)
    }
    setSaving(false)
  }

  const filtered = filter === 'todos' ? projects : projects.filter(p => p.status === filter)

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Projetos</h1>
          <p style={{ color: 'var(--ts)', fontSize: 13 }}>
            {projects.filter(p => p.status === 'andamento').length} ativos · {projects.length} total
          </p>
        </div>
        <button className="btn bp" onClick={openModal}>+ Novo projeto</button>
      </div>

      {/* Filtros */}
      <div className="tabs">
        {([['todos', 'Todos'], ['andamento', 'Em andamento'], ['concluido', 'Concluídos']] as const).map(([val, label]) => (
          <button key={val} className={`tab-btn${filter === val ? ' active' : ''}`} onClick={() => setFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      {/* Grid de projetos */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div className="empty-state-title">Nenhum projeto aqui</div>
          <div className="empty-state-sub">Crie seu primeiro projeto para começar</div>
          <button className="btn bp" onClick={openModal}>+ Novo projeto</button>
        </div>
      ) : (
        <div className="g3">
          {filtered.map(p => {
            const etapas = p.etapas || ETAPAS_DEFAULT
            const idx = etapas.indexOf(p.etapa_atual)
            const prog = etapas.length > 1 ? Math.round((idx / (etapas.length - 1)) * 100) : 0
            const cliente = (p as any).client as Pick<Client, 'id' | 'nome'> | null

            return (
              <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--s)', border: '1px solid var(--b)', borderRadius: 'var(--rad)',
                  padding: 22, boxShadow: 'var(--sh)', cursor: 'pointer', transition: 'all .18s',
                  borderLeft: `4px solid ${p.cor || 'var(--p)'}`,
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shm)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh)'; (e.currentTarget as HTMLElement).style.transform = '' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, flex: 1, paddingRight: 8 }}>{p.nome}</div>
                    <span className={`bdg ${statusColors[p.status] || 'bdgr'}`}>{statusLabels[p.status]}</span>
                  </div>
                  {cliente && (
                    <div style={{ fontSize: 13, color: 'var(--ts)', marginBottom: 12 }}>👤 {cliente.nome}</div>
                  )}
                  {p.valor > 0 && (
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--g)', marginBottom: 12 }}>{fmtBRL(p.valor)}</div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ts)', marginBottom: 6 }}>
                      <span>{p.etapa_atual}</span>
                      <span>{prog}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${prog}%` }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {etapas.map((et: string) => (
                      <div key={et} style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: etapas.indexOf(et) <= idx ? 'var(--p)' : 'var(--b)',
                      }} title={et} />
                    ))}
                    {p.data_prazo && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ts)' }}>
                        📅 {fmtDate(p.data_prazo)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Modal novo projeto */}
      <div className={`modal-bg${modal ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && setModal(false)}>
        <div className="modal-panel" style={{ maxWidth: 600 }}>
          <div className="modal-header">
            <div className="modal-title">Novo projeto</div>
            <button className="modal-close" onClick={() => setModal(false)}>✕</button>
          </div>
          <div className="form-grid">
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Nome do projeto *</label>
              <input className="form-input" placeholder="Ex: Identidade Visual · Café Nordeste" value={nome} onChange={e => setNome(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="form-label">Cliente</label>
              <select className="form-input" value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">— Sem cliente —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Prioridade</label>
              <select className="form-input" value={prioridade} onChange={e => setPrioridade(e.target.value as typeof prioridade)}>
                <option value="baixa">🟢 Baixa</option>
                <option value="normal">🔵 Normal</option>
                <option value="alta">🔴 Alta</option>
              </select>
            </div>
            <div>
              <label className="form-label">Valor do projeto (R$)</label>
              <input className="form-input" type="number" placeholder="0,00" min="0" value={valor} onChange={e => setValor(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Horas estimadas</label>
              <input className="form-input" type="number" placeholder="0" min="0" value={horasEst} onChange={e => setHorasEst(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Data de início</label>
              <input className="form-input" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Prazo de entrega</label>
              <input className="form-input" type="date" value={dataPrazo} onChange={e => setDataPrazo(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Cor do projeto</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {['#5413A0', '#F28C28', '#18A058', '#D94040', '#3b5bdb', '#e67e22'].map(c => (
                  <div key={c} onClick={() => setCor(c)} style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: cor === c ? '3px solid var(--t)' : '3px solid transparent',
                  }} />
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Descrição (opcional)</label>
              <textarea className="form-input" placeholder="Detalhes do projeto..." value={descricao} onChange={e => setDescricao(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
            <button className="btn bg-btn" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn bp" onClick={saveProject} disabled={saving || !nome.trim()}>
              {saving ? 'Salvando...' : '✓ Criar projeto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
