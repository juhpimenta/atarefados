'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Project, Client } from '@/lib/types'
import { fmtBRL, fmtDate } from '@/lib/types'
import { FolderOpen, User, CalendarDays, X, Sparkles, Loader, ChevronRight, ChevronLeft, Clock, TrendingUp, BarChart2 } from 'lucide-react'
import type { EstimateResult } from '@/app/api/estimate/route'

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

const NATUREZAS = [
  'Design', 'Desenvolvimento', 'Conteúdo / Redação', 'Marketing', 'UX / Pesquisa', 'Vídeo / Foto', 'Outro',
]
const TIPOS_POR_NATUREZA: Record<string, string[]> = {
  'Design': ['Identidade visual', 'Landing page', 'Site institucional', 'Apresentação', 'Infográfico', 'Motion design', 'Outro'],
  'Desenvolvimento': ['Landing page', 'Site institucional', 'E-commerce', 'Dashboard', 'Aplicativo mobile', 'API / Backend', 'Outro'],
  'Conteúdo / Redação': ['Artigo / Blog', 'Copy publicitário', 'E-mail marketing', 'Roteiro', 'Social media', 'Outro'],
  'Marketing': ['Campanha social media', 'Gestão de tráfego', 'SEO', 'Email marketing', 'Lançamento', 'Outro'],
  'UX / Pesquisa': ['Pesquisa UX', 'Wireframe', 'Prototipagem', 'Teste de usabilidade', 'Outro'],
  'Vídeo / Foto': ['Vídeo institucional', 'Reels / Short', 'Ensaio fotográfico', 'Edição de vídeo', 'Outro'],
  'Outro': ['Consultoria', 'Mentoria', 'Treinamento', 'Outro'],
}

const origemLabel: Record<string, string> = {
  historico: 'Baseado no seu histórico',
  ia: 'Sugerido pela IA',
  hibrida: 'Histórico + IA',
  manual: 'Definido manualmente',
}
const origemColor: Record<string, string> = {
  historico: 'var(--g)', ia: 'var(--p)', hibrida: 'var(--p)', manual: 'var(--ts)',
}

export default function ProjectsClient({ userId, initialProjects, clients }: Props) {
  const supabase = createClient()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [modal, setModal] = useState(false)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [filter, setFilter] = useState<'todos' | 'andamento' | 'concluido'>('todos')

  // Step 1 — dados básicos
  const [nome, setNome] = useState('')
  const [clientId, setClientId] = useState('')
  const [valor, setValor] = useState('')
  const [dataPrazo, setDataPrazo] = useState('')
  const [cor, setCor] = useState('#5413A0')
  const [prioridade, setPrioridade] = useState<'baixa' | 'normal' | 'alta'>('normal')
  const [descricao, setDescricao] = useState('')

  // Step 2 — perfil do projeto
  const [natureza, setNatureza] = useState(NATUREZAS[0])
  const [tipoProj, setTipoProj] = useState('')
  const [complexidade, setComplexidade] = useState<'simples' | 'medio' | 'complexo'>('medio')
  const [infoExtra, setInfoExtra] = useState('')

  // Step 3 — estimativa
  const [estimating, setEstimating] = useState(false)
  const [estimate, setEstimate] = useState<EstimateResult | null>(null)
  const [estimateError, setEstimateError] = useState('')
  const [horasEst, setHorasEst] = useState('')

  function openModal() {
    setNome(''); setClientId(''); setValor(''); setDataPrazo(''); setCor('#5413A0')
    setPrioridade('normal'); setDescricao(''); setNatureza(NATUREZAS[0]); setTipoProj('')
    setComplexidade('medio'); setInfoExtra(''); setEstimate(null); setEstimateError('')
    setHorasEst(''); setSaveError(''); setStep(1); setModal(true)
  }

  function closeModal() {
    setModal(false)
    setStep(1)
    setEstimate(null)
    setEstimating(false)
    setSaveError('')
  }

  const tiposDisponiveis = TIPOS_POR_NATUREZA[natureza] || TIPOS_POR_NATUREZA['Outro']

  async function gerarEstimativa() {
    const tipo = tipoProj || tiposDisponiveis[0]
    setEstimating(true)
    setEstimateError('')
    setEstimate(null)
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ natureza, tipo_projeto: tipo, complexidade, info_extra: infoExtra }),
      })
      if (!res.ok) throw new Error('Falha na estimativa')
      const data: EstimateResult = await res.json()
      setEstimate(data)
      setHorasEst(String(data.horas))
    } catch {
      setEstimateError('Não foi possível gerar a estimativa automática. Informe manualmente.')
    } finally {
      setEstimating(false)
    }
  }

  function goToStep3() {
    setStep(3)
    gerarEstimativa()
  }

  async function saveProject() {
    if (!nome.trim()) return
    setSaving(true)
    setSaveError('')

    const tipo = tipoProj || tiposDisponiveis[0]
    const hEst = parseFloat(horasEst) || 0

    const { data, error } = await supabase.from('projects').insert({
      user_id: userId,
      nome: nome.trim(),
      status: 'andamento',
      client_id: clientId || null,
      descricao: descricao || null,
      valor: parseFloat(valor) || 0,
      horas_est: hEst,
      data_prazo: dataPrazo || null,
      prioridade,
      cor,
      etapas: ETAPAS_DEFAULT,
      etapa_atual: 'Briefing',
    }).select('*').single()

    setSaving(false)

    if (error) {
      setSaveError(`Erro ao criar projeto: ${error.message}`)
      return
    }
    if (data) {
      const clienteObj = clientId ? clients.find(c => c.id === clientId) ?? null : null
      setProjects(prev => [{ ...data, client: clienteObj } as unknown as Project, ...prev])
      closeModal()
    }
  }

  const filtered = filter === 'todos' ? projects : projects.filter(p => p.status === filter)

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Projetos</h1>
          <p>{projects.filter(p => p.status === 'andamento').length} ativos · {projects.length} total</p>
        </div>
        <div className="page-header-actions">
          <button className="btn bp" onClick={openModal}>+ Novo projeto</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="tabs">
        {([['todos', 'Todos'], ['andamento', 'Em andamento'], ['concluido', 'Concluídos']] as const).map(([val, label]) => (
          <button key={val} className={`tab-btn${filter === val ? ' active' : ''}`} onClick={() => setFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderOpen size={22} color="var(--o)" strokeWidth={1.5} /></div>
          <div className="empty-state-title">Nenhum projeto aqui</div>
          <div className="empty-state-sub">Crie seu primeiro projeto para começar a registrar tempo e faturamento</div>
          <button className="btn bp btn-sm" onClick={openModal}>+ Novo projeto</button>
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
                    <div style={{ fontSize: 13, color: 'var(--ts)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <User size={12} /> {cliente.nome}
                    </div>
                  )}
                  {p.tipo_projeto && (
                    <div style={{ fontSize: 12, color: 'var(--ts)', marginBottom: 8 }}>
                      {p.natureza} · {p.tipo_projeto}
                      {p.complexidade && <span style={{ marginLeft: 6, color: p.complexidade === 'complexo' ? 'var(--r)' : p.complexidade === 'simples' ? 'var(--g)' : 'var(--o)' }}>({p.complexidade})</span>}
                    </div>
                  )}
                  {p.valor > 0 && (
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--g)', marginBottom: 12 }}>{fmtBRL(p.valor)}</div>
                  )}
                  {p.horas_est > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--ts)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {p.horas_est}h estimadas
                      {p.horas_est_origem && p.horas_est_origem !== 'manual' && (
                        <span style={{ color: origemColor[p.horas_est_origem], marginLeft: 4 }}>
                          · {origemLabel[p.horas_est_origem]}
                        </span>
                      )}
                    </div>
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
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {etapas.map((et: string) => (
                      <div key={et} style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: etapas.indexOf(et) <= idx ? 'var(--p)' : 'var(--b)',
                      }} title={et} />
                    ))}
                    {p.data_prazo && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ts)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <CalendarDays size={11} /> {fmtDate(p.data_prazo)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Modal wizard ── */}
      <div className={`modal-bg${modal ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && closeModal()}>
        <div className="modal-panel" style={{ maxWidth: 580 }}>

          {/* ── Step 1: dados básicos ── */}
          {step === 1 && (
            <>
              <div className="modal-header">
                <div>
                  <div className="modal-title">Novo projeto</div>
                  <div style={{ fontSize: 12, color: 'var(--ts)', marginTop: 2 }}>Passo 1 de 3 · Informações gerais</div>
                </div>
                <button className="modal-close" onClick={closeModal}><X size={14} /></button>
              </div>

              {/* Indicador de passos */}
              <StepBar step={1} />

              <div className="form-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nome do projeto *</label>
                  <input className="form-input" placeholder="Ex: Identidade Visual · Café Nordeste" value={nome}
                    onChange={e => setNome(e.target.value)} autoFocus />
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
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Valor do projeto (R$)</label>
                  <input className="form-input" type="number" placeholder="0,00" min="0" value={valor}
                    onChange={e => setValor(e.target.value)} />
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
                  <textarea className="form-input" placeholder="Objetivo, contexto, entregáveis..." value={descricao}
                    onChange={e => setDescricao(e.target.value)} rows={2} />
                </div>
              </div>
              <div className="modal-footer end">
                <button className="btn bp" onClick={() => nome.trim() && setStep(2)} disabled={!nome.trim()}>
                  Próximo <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: perfil do projeto ── */}
          {step === 2 && (
            <>
              <div className="modal-header">
                <div>
                  <div className="modal-title">Perfil do projeto</div>
                  <div style={{ fontSize: 12, color: 'var(--ts)', marginTop: 2 }}>Passo 2 de 3 · Para gerar estimativa inteligente</div>
                </div>
                <button className="modal-close" onClick={closeModal}><X size={14} /></button>
              </div>

              <StepBar step={2} />

              <div className="form-grid">
                <div>
                  <label className="form-label">Natureza do projeto</label>
                  <select className="form-input" value={natureza} onChange={e => { setNatureza(e.target.value); setTipoProj('') }}>
                    {NATUREZAS.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Tipo de trabalho</label>
                  <select className="form-input" value={tipoProj} onChange={e => setTipoProj(e.target.value)}>
                    <option value="">— Selecionar —</option>
                    {tiposDisponiveis.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Complexidade</label>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    {(['simples', 'medio', 'complexo'] as const).map(c => (
                      <div key={c} onClick={() => setComplexidade(c)} style={{
                        flex: 1, padding: '12px 0', borderRadius: 'var(--rsm)', textAlign: 'center',
                        border: `2px solid ${complexidade === c ? 'var(--p)' : 'var(--b)'}`,
                        background: complexidade === c ? 'var(--pl)' : 'var(--s)',
                        cursor: 'pointer', fontWeight: complexidade === c ? 700 : 500,
                        color: complexidade === c ? 'var(--p)' : 'var(--t)',
                        fontSize: 14, transition: 'all .15s',
                      }}>
                        {c === 'simples' ? 'Simples' : c === 'medio' ? 'Médio' : 'Complexo'}
                        <div style={{ fontSize: 11, color: 'var(--ts)', marginTop: 4, fontWeight: 400 }}>
                          {c === 'simples' ? '~menos horas' : c === 'medio' ? 'padrão' : '~mais horas'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Informações adicionais (opcional)</label>
                  <textarea className="form-input" rows={2}
                    placeholder="Ex: 5 páginas, integração com API, cliente novo, prazo apertado..."
                    value={infoExtra} onChange={e => setInfoExtra(e.target.value)} />
                </div>
              </div>

              <div className="modal-footer between">
                <button className="btn bg-btn" onClick={() => setStep(1)}>
                  <ChevronLeft size={15} /> Voltar
                </button>
                <button className="btn bp" onClick={goToStep3}>
                  <Sparkles size={15} /> Gerar estimativa
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: estimativa + salvar ── */}
          {step === 3 && (
            <>
              <div className="modal-header">
                <div>
                  <div className="modal-title">Estimativa de horas</div>
                  <div style={{ fontSize: 12, color: 'var(--ts)', marginTop: 2 }}>Passo 3 de 3 · Revise e salve</div>
                </div>
                <button className="modal-close" onClick={closeModal}><X size={14} /></button>
              </div>

              <StepBar step={3} />

              {/* Caixa de estimativa */}
              {estimating && (
                <div style={{
                  background: 'var(--pl)', borderRadius: 'var(--rad)', padding: '24px 20px',
                  textAlign: 'center', marginBottom: 20,
                }}>
                  <Loader size={28} color="var(--p)" style={{ animation: 'spin 1s linear infinite' }} />
                  <div style={{ marginTop: 12, fontWeight: 600 }}>Analisando seu histórico e gerando estimativa...</div>
                  <div style={{ fontSize: 13, color: 'var(--ts)', marginTop: 4 }}>Comparando projetos similares e consultando IA</div>
                </div>
              )}

              {!estimating && estimateError && (
                <div className="alert alert-r" style={{ marginBottom: 20 }}>{estimateError}</div>
              )}

              {!estimating && estimate && (
                <div style={{
                  background: 'var(--pl)', borderRadius: 'var(--rad)', padding: '20px',
                  marginBottom: 20, border: '1px solid var(--p)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ts)', marginBottom: 4 }}>
                        Estimativa sugerida
                      </div>
                      <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--p)', lineHeight: 1 }}>
                        {estimate.horas}h
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: 'var(--s)', border: '1px solid var(--b)', borderRadius: 8,
                        padding: '4px 10px', fontSize: 12, fontWeight: 600,
                        color: origemColor[estimate.origem],
                      }}>
                        {estimate.origem === 'historico' && <><BarChart2 size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} /></>}
                        {estimate.origem === 'ia' && <><Sparkles size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} /></>}
                        {estimate.origem === 'hibrida' && <><TrendingUp size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} /></>}
                        {origemLabel[estimate.origem]}
                      </span>
                      {estimate.projetos_similares && estimate.projetos_similares > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--ts)', marginTop: 6 }}>
                          {estimate.projetos_similares} projeto(s) similar(es) no histórico
                          {estimate.media_historico && ` · média ${estimate.media_historico.toFixed(0)}h`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ts)', lineHeight: 1.5 }}>
                    {estimate.explicacao}
                  </div>
                </div>
              )}

              {/* Campo editável de horas */}
              {!estimating && (
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} />
                    {estimate ? 'Ajustar estimativa (opcional)' : 'Horas estimadas'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input className="form-input" type="number" min="0" placeholder="Ex: 40"
                      value={horasEst} onChange={e => setHorasEst(e.target.value)}
                      style={{ width: 140 }} />
                    <span style={{ fontSize: 13, color: 'var(--ts)' }}>horas</span>
                    {estimate && horasEst !== String(estimate.horas) && (
                      <button className="btn bg-btn btn-sm" onClick={() => setHorasEst(String(estimate.horas))}>
                        Usar sugestão ({estimate.horas}h)
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ts)', marginTop: 6 }}>
                    Deixe em branco para não definir agora. Você pode editar depois com mais informações.
                  </div>
                </div>
              )}

              {/* Resumo do projeto */}
              {!estimating && (
                <div style={{
                  background: 'var(--bg)', border: '1px solid var(--b)', borderRadius: 'var(--rsm)',
                  padding: '14px 16px', marginBottom: 20, fontSize: 13,
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{nome}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', color: 'var(--ts)' }}>
                    <span>{natureza} · {tipoProj || tiposDisponiveis[0]}</span>
                    <span>Complexidade: {complexidade}</span>
                    {valor && <span>{fmtBRL(parseFloat(valor))}</span>}
                    {dataPrazo && <span><CalendarDays size={11} style={{ verticalAlign: 'middle' }} /> {fmtDate(dataPrazo)}</span>}
                  </div>
                </div>
              )}

              {saveError && <div className="alert alert-r" style={{ marginBottom: 16 }}>{saveError}</div>}

              <div className="modal-footer between">
                <button className="btn bg-btn" onClick={() => setStep(2)} disabled={saving}>
                  <ChevronLeft size={15} /> Voltar
                </button>
                <button className="btn bp" onClick={saveProject} disabled={saving || estimating} style={{ flex: 1, marginLeft: 10, justifyContent: 'center' }}>
                  {saving ? 'Criando projeto...' : '✓ Criar projeto'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function StepBar({ step }: { step: number }) {
  const steps = ['Informações', 'Perfil', 'Estimativa']
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, marginTop: 4 }}>
      {steps.map((label, i) => {
        const idx = i + 1
        const done = step > idx
        const active = step === idx
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: done ? 'var(--g)' : active ? 'var(--p)' : 'var(--b)',
                color: done || active ? '#fff' : 'var(--ts)',
                boxShadow: active ? '0 0 0 4px var(--pl)' : 'none',
              }}>
                {done ? '✓' : idx}
              </div>
              <div style={{ fontSize: 10, color: active ? 'var(--p)' : 'var(--ts)', marginTop: 4, whiteSpace: 'nowrap', fontWeight: active ? 600 : 400 }}>
                {label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? 'var(--g)' : 'var(--b)', margin: '0 6px', marginBottom: 16 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
