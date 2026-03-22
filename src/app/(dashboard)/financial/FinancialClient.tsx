'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { FinancialTransaction } from '@/lib/types'
import { fmtBRL, fmtDate, formaPagLabel } from '@/lib/types'

type Props = {
  userId: string
  initialTransactions: FinancialTransaction[]
  projects: { id: string; nome: string }[]
  clients: { id: string; nome: string }[]
  metaMensal: number
  mesAtual: string
}

const subtiposEntrada = ['Entrada / sinal', 'Saldo final', 'Parcela', 'Avulso', 'Reembolso']
const subtiposDespesa = ['Software/Assinatura', 'Hardware', 'Marketing', 'Educação', 'Contabilidade', 'Aluguel', 'Outros']
const formasPag = [
  { value: 'pix', label: '⚡ PIX' },
  { value: 'ted', label: '🏦 TED' },
  { value: 'cartao', label: '💳 Cartão' },
  { value: 'dinheiro', label: '💵 Dinheiro' },
  { value: 'boleto', label: '📄 Boleto' },
]

export default function FinancialClient({ userId, initialTransactions, projects, clients, metaMensal, mesAtual }: Props) {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(initialTransactions)
  const [modalType, setModalType] = useState<'entrada' | 'despesa' | null>(null)
  const [modalStep, setModalStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'todos' | 'entrada' | 'despesa'>('todos')
  const [mesFiltro, setMesFiltro] = useState(mesAtual)

  // Form
  const [projectId, setProjectId] = useState('')
  const [clientId, setClientId] = useState('')
  const [valor, setValor] = useState('')
  const [subtipo, setSubtipo] = useState('')
  const [formaPag, setFormaPag] = useState('pix')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [descricao, setDescricao] = useState('')
  const [obs, setObs] = useState('')

  function openModal(tipo: 'entrada' | 'despesa') {
    setModalType(tipo)
    setModalStep(1)
    setProjectId(''); setClientId(''); setValor(''); setFormaPag('pix')
    setData(new Date().toISOString().split('T')[0]); setDescricao(''); setObs('')
    setSubtipo(tipo === 'entrada' ? subtiposEntrada[0] : subtiposDespesa[0])
  }

  async function salvar() {
    if (!valor || parseFloat(valor) <= 0) return
    setSaving(true)
    const proj = projects.find(p => p.id === projectId)
    const cli = clients.find(c => c.id === clientId)
    const { data: newT, error } = await supabase.from('financial_transactions').insert({
      user_id: userId,
      tipo: modalType,
      subtipo,
      valor: parseFloat(valor),
      forma_pag: formaPag,
      data,
      project_id: projectId || null,
      client_id: clientId || null,
      descricao: descricao || (modalType === 'entrada' ? 'Recebimento' : 'Despesa'),
      notas: obs || null,
      status: 'confirmado',
    }).select('*, project:projects(id,nome), client:clients(id,nome)').single()

    if (!error && newT) {
      setTransactions(prev => [newT as FinancialTransaction, ...prev])
      setModalStep(3) // sucesso
    }
    setSaving(false)
  }

  // Métricas
  const txMes = transactions.filter(t => t.data?.startsWith(mesFiltro))
  const recebidoMes = txMes.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0)
  const despesasMes = txMes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const saldoMes = recebidoMes - despesasMes
  const progMeta = metaMensal > 0 ? Math.min((recebidoMes / metaMensal) * 100, 100) : 0

  const filtered = transactions
    .filter(t => filter === 'todos' || t.tipo === filter)
    .filter(t => !mesFiltro || t.data?.startsWith(mesFiltro))

  // Helper mês display
  const mesesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const [mAno, mMes] = mesFiltro.split('-')
  const mesDisplay = `${mesesPt[parseInt(mMes) - 1]} ${mAno}`

  const proj = projects.find(p => p.id === projectId)
  const cli = clients.find(c => c.id === clientId)

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Financeiro</h1>
          <p style={{ color: 'var(--ts)', fontSize: 13 }}>{mesDisplay}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn bg-btn" onClick={() => openModal('despesa')}>🧾 Despesa</button>
          <button className="btn bp" onClick={() => openModal('entrada')}>💸 Recebimento</button>
        </div>
      </div>

      {/* Métricas */}
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card">
          <div className="metric-label">💰 Recebido</div>
          <div className="metric-value" style={{ color: 'var(--g)', fontSize: 24 }}>{fmtBRL(recebidoMes)}</div>
          {metaMensal > 0 && (
            <>
              <div className="progress-bar" style={{ marginTop: 10, marginBottom: 6 }}>
                <div className="progress-fill green" style={{ width: `${progMeta}%` }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--ts)' }}>{progMeta.toFixed(0)}% da meta ({fmtBRL(metaMensal)})</div>
            </>
          )}
        </div>
        <div className="metric-card">
          <div className="metric-label">🧾 Despesas</div>
          <div className="metric-value" style={{ color: 'var(--r)', fontSize: 24 }}>{fmtBRL(despesasMes)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">📊 Saldo</div>
          <div className="metric-value" style={{ color: saldoMes >= 0 ? 'var(--g)' : 'var(--r)', fontSize: 24 }}>{fmtBRL(saldoMes)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">📋 Transações</div>
          <div className="metric-value" style={{ fontSize: 24 }}>{txMes.length}</div>
          <div style={{ fontSize: 12, color: 'var(--ts)' }}>{txMes.filter(t => t.tipo === 'entrada').length} entradas · {txMes.filter(t => t.tipo === 'despesa').length} saídas</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="tabs" style={{ marginBottom: 0, border: 'none' }}>
          {([['todos', 'Todos'], ['entrada', 'Entradas'], ['despesa', 'Despesas']] as const).map(([v, l]) => (
            <button key={v} className={`tab-btn${filter === v ? ' active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
        <input type="month" className="form-input" style={{ width: 'auto', marginLeft: 'auto' }}
          value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} />
      </div>

      {/* Lista */}
      <div className="card">
        <div className="card-body">
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">💰</div>
              <div className="empty-state-title">Nenhuma transação</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
                <button className="btn bg-btn btn-sm" onClick={() => openModal('despesa')}>+ Despesa</button>
                <button className="btn bp btn-sm" onClick={() => openModal('entrada')}>+ Recebimento</button>
              </div>
            </div>
          ) : (
            filtered.map(t => (
              <div key={t.id} className="fin-row">
                <div style={{ fontSize: 20 }}>{t.tipo === 'entrada' ? '💸' : '🧾'}</div>
                <div className="fin-row-content">
                  <div className="fin-row-title">{t.descricao || (t.tipo === 'entrada' ? 'Recebimento' : 'Despesa')}</div>
                  <div className="fin-row-sub">
                    {t.subtipo && `${t.subtipo} · `}
                    {t.forma_pag && `${formaPagLabel[t.forma_pag] || t.forma_pag} · `}
                    {t.data ? fmtDate(t.data) : '—'}
                    {(t as any).project?.nome && ` · 📁 ${(t as any).project.nome}`}
                    {(t as any).client?.nome && ` · 👤 ${(t as any).client.nome}`}
                  </div>
                </div>
                <div>
                  <div className={`fin-row-value ${t.tipo === 'entrada' ? 'pos' : 'neg'}`}>
                    {t.tipo === 'entrada' ? '+' : '-'}{fmtBRL(t.valor)}
                  </div>
                  <span className={`bdg ${t.status === 'confirmado' ? 'bdg-g' : t.status === 'pendente' ? 'bdy' : 'bdr'}`} style={{ fontSize: 11 }}>
                    {t.status === 'confirmado' ? 'Confirmado' : t.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <div className={`modal-bg${modalType ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && modalStep !== 3 && setModalType(null)}>
        <div className="modal-panel">
          {/* Step 1 - Identificação */}
          {modalStep === 1 && (
            <>
              <div className="modal-header">
                <div>
                  <div className="modal-title">{modalType === 'entrada' ? 'Registrar recebimento' : 'Registrar despesa'}</div>
                  <div style={{ fontSize: 13, color: 'var(--ts)', marginTop: 2 }}>Passo 1 de 2 · Identificação</div>
                </div>
                <button className="modal-close" onClick={() => setModalType(null)}>✕</button>
              </div>
              <div className="modal-steps">
                <div className="ms-item"><div className="ms-dot act">1</div><div className="ms-line" /></div>
                <div className="ms-item"><div className="ms-dot pend">2</div></div>
              </div>
              <div className="form-group">
                <label className="form-label">Projeto relacionado</label>
                <select className="form-input" value={projectId} onChange={e => setProjectId(e.target.value)}>
                  <option value="">— Selecionar projeto —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cliente</label>
                <select className="form-input" value={clientId} onChange={e => setClientId(e.target.value)}>
                  <option value="">— Selecionar cliente —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-input" value={subtipo} onChange={e => setSubtipo(e.target.value)}>
                  {(modalType === 'entrada' ? subtiposEntrada : subtiposDespesa).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição (opcional)</label>
                <input className="form-input" placeholder="Ex: 1ª parcela conforme contrato" value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn bp" onClick={() => setModalStep(2)}>Próximo →</button>
              </div>
            </>
          )}

          {/* Step 2 - Valor */}
          {modalStep === 2 && (
            <>
              <div className="modal-header">
                <div>
                  <div className="modal-title">{modalType === 'entrada' ? 'Registrar recebimento' : 'Registrar despesa'}</div>
                  <div style={{ fontSize: 13, color: 'var(--ts)', marginTop: 2 }}>Passo 2 de 2 · Valor e pagamento</div>
                </div>
                <button className="modal-close" onClick={() => setModalType(null)}>✕</button>
              </div>
              <div className="modal-steps">
                <div className="ms-item"><div className="ms-dot done">✓</div><div className="ms-line done" /></div>
                <div className="ms-item"><div className="ms-dot act">2</div></div>
              </div>
              <div className="form-group">
                <label className="form-label">Valor (R$) *</label>
                <input className="form-input" type="number" placeholder="0,00" min="0" step="0.01" value={valor} onChange={e => setValor(e.target.value)} autoFocus style={{ fontSize: 24, fontWeight: 700 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Data</label>
                <input className="form-input" type="date" value={data} onChange={e => setData(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Forma de pagamento</label>
                <div className="radio-group" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {formasPag.map(fp => (
                    <div key={fp.value}
                      className={`radio-opt${formaPag === fp.value ? ' sel' : ''}`}
                      style={{ flex: 1, minWidth: 100, padding: '10px 14px' }}
                      onClick={() => setFormaPag(fp.value)}
                    >
                      <div className="radio-dot" />
                      <div className="radio-label">{fp.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 'var(--rsm)', padding: '14px 16px', marginBottom: 20, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--ts)' }}>Tipo</span><strong>{subtipo}</strong>
                </div>
                {proj && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'var(--ts)' }}>Projeto</span><strong>{proj.nome}</strong></div>}
                {cli && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'var(--ts)' }}>Cliente</span><strong>{cli.nome}</strong></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--b)' }}>
                  <strong>Valor</strong>
                  <strong style={{ color: modalType === 'entrada' ? 'var(--g)' : 'var(--r)' }}>
                    {valor ? fmtBRL(parseFloat(valor)) : 'R$ —'}
                  </strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                <button className="btn bg-btn" onClick={() => setModalStep(1)}>← Voltar</button>
                <button className="btn bp" style={{ flex: 1, justifyContent: 'center' }} onClick={salvar} disabled={saving || !valor}>
                  {saving ? 'Salvando...' : '✓ Confirmar'}
                </button>
              </div>
            </>
          )}

          {/* Step 3 - Sucesso */}
          {modalStep === 3 && (
            <div className="success-screen">
              <div className="success-icon">{modalType === 'entrada' ? '🎉' : '✅'}</div>
              <div className="success-title">{modalType === 'entrada' ? 'Recebimento registrado!' : 'Despesa registrada!'}</div>
              <div className="success-sub">{modalType === 'entrada' ? 'O valor foi adicionado ao seu histórico e sua meta do mês foi atualizada.' : 'A despesa foi adicionada ao seu histórico financeiro.'}</div>
              <div style={{ background: modalType === 'entrada' ? 'var(--gl)' : 'var(--rl)', border: `1px solid ${modalType === 'entrada' ? 'var(--g)' : 'var(--r)'}`, borderRadius: 'var(--rad)', padding: '16px 20px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: modalType === 'entrada' ? '#157040' : 'var(--r)' }}>{descricao || subtipo}</span>
                  <strong style={{ fontSize: 20, color: modalType === 'entrada' ? 'var(--g)' : 'var(--r)' }}>{fmtBRL(parseFloat(valor || '0'))}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn bg-btn" onClick={() => setModalType(null)}>Fechar</button>
                <button className="btn bp" onClick={() => openModal(modalType!)}>Registrar outro</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
