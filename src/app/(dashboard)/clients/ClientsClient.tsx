'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Client } from '@/lib/types'
import { fmtBRL, initials } from '@/lib/types'

const segmentos = [
  'Alimentação e varejo', 'Saúde e bem-estar', 'Tecnologia e startups',
  'Moda e beleza', 'Educação', 'Imobiliário', 'Serviços profissionais', 'Outro',
]
const origens = [
  'Indicação de cliente', 'Redes sociais', 'Site / portfólio',
  'Abordagem direta (cold)', 'Evento / networking', 'Outro',
]
const aprovLabels: Record<string, string> = {
  rapido: '⚡ Aprova sozinho e rápido',
  socio: '👥 Consulta sócio ou equipe',
  comite: '🏢 Aprovação em comitê',
}

type Props = { userId: string; initialClients: (Client & { _projects_count: number; _total_faturado: number })[] }

export default function ClientsClient({ userId, initialClients }: Props) {
  const supabase = createClient()
  const [clients, setClients] = useState(initialClients)
  const [modal, setModal] = useState(false)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  // Form
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState('')
  const [cargo, setCargo] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cidade, setCidade] = useState('')
  const [segmento, setSegmento] = useState(segmentos[0])
  const [aprov, setAprov] = useState<'rapido' | 'socio' | 'comite'>('rapido')
  const [origem, setOrigem] = useState(origens[0])

  function openModal() {
    setNome(''); setContato(''); setCargo(''); setEmail(''); setWhatsapp('')
    setCidade(''); setSegmento(segmentos[0]); setAprov('rapido'); setOrigem(origens[0])
    setStep(1); setModal(true)
  }

  async function save() {
    setSaving(true)
    const { data, error } = await supabase.from('clients').insert({
      user_id: userId, nome: nome.trim(), contato, cargo, email, whatsapp,
      cidade, segmento, perfil_aprov: aprov, origem,
    }).select('*').single()
    if (!error && data) {
      setClients(prev => [{ ...data, _projects_count: 0, _total_faturado: 0 }, ...prev])
      setStep(4)
    }
    setSaving(false)
  }

  const filtered = clients.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.segmento?.toLowerCase().includes(search.toLowerCase())
  )

  const ini = initials(nome || '?')

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Clientes</h1>
          <p style={{ color: 'var(--ts)', fontSize: 13 }}>{clients.length} clientes na carteira</p>
        </div>
        <button className="btn bp" onClick={openModal}>+ Novo cliente</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input className="form-input" placeholder="🔍 Buscar por nome, e-mail ou segmento..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}</div>
          {!search && <div className="empty-state-sub">Cadastre seu primeiro cliente para começar</div>}
          {!search && <button className="btn bp" onClick={openModal}>+ Novo cliente</button>}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Segmento</th>
                  <th>Projetos</th>
                  <th>Faturado</th>
                  <th>Perfil de aprovação</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, background: 'var(--pl)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: 'var(--p)', fontSize: 13, flexShrink: 0,
                        }}>{initials(c.nome)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.nome}</div>
                          <div style={{ fontSize: 12, color: 'var(--ts)' }}>{c.email || c.contato || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{c.segmento || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{c._projects_count}</td>
                    <td style={{ fontWeight: 600, color: 'var(--g)' }}>{fmtBRL(c._total_faturado)}</td>
                    <td>
                      <span className={`bdg ${c.perfil_aprov === 'rapido' ? 'bdg-g' : c.perfil_aprov === 'comite' ? 'bdr' : 'bdy'}`}>
                        {c.perfil_aprov === 'rapido' ? '⚡ Rápido' : c.perfil_aprov === 'socio' ? '👥 Sócio' : '🏢 Comitê'}
                      </span>
                    </td>
                    <td>
                      <span className={`bdg ${c.status === 'ativo' ? 'bdg-g' : 'bdgr'}`}>{c.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td>
                      {c.whatsapp && (
                        <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g,'')}`} target="_blank" className="btn bg-btn btn-sm">💬 WhatsApp</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 3 passos */}
      <div className={`modal-bg${modal ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && step !== 4 && setModal(false)}>
        <div className="modal-panel">

          {/* Step 1 - Dados básicos */}
          {step === 1 && (
            <>
              <div className="modal-header">
                <div>
                  <div className="modal-title">Novo cliente</div>
                  <div style={{ fontSize: 13, color: 'var(--ts)', marginTop: 2 }}>Passo 1 de 3 · Dados básicos</div>
                </div>
                <button className="modal-close" onClick={() => setModal(false)}>✕</button>
              </div>
              <div className="modal-steps">
                <div className="ms-item"><div className="ms-dot act">1</div><div className="ms-line" /></div>
                <div className="ms-item"><div className="ms-dot pend">2</div><div className="ms-line" /></div>
                <div className="ms-item"><div className="ms-dot pend">3</div></div>
              </div>
              <div className="form-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nome do cliente / empresa *</label>
                  <input className="form-input" placeholder="Ex: Café Nordeste" value={nome} onChange={e => setNome(e.target.value)} autoFocus />
                </div>
                <div><label className="form-label">Nome do contato</label><input className="form-input" placeholder="Ex: Ana Carolina" value={contato} onChange={e => setContato(e.target.value)} /></div>
                <div><label className="form-label">Cargo / função</label><input className="form-input" placeholder="Ex: Sócia-fundadora" value={cargo} onChange={e => setCargo(e.target.value)} /></div>
                <div><label className="form-label">E-mail</label><input type="email" className="form-input" placeholder="contato@empresa.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><label className="form-label">WhatsApp</label><input type="tel" className="form-input" placeholder="(27) 99999-0000" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Cidade / Estado</label><input className="form-input" placeholder="Ex: Vitória, ES" value={cidade} onChange={e => setCidade(e.target.value)} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn bp" onClick={() => { if (nome.trim()) setStep(2) }} disabled={!nome.trim()}>Próximo →</button>
              </div>
            </>
          )}

          {/* Step 2 - Perfil */}
          {step === 2 && (
            <>
              <div className="modal-header">
                <div><div className="modal-title">Novo cliente</div><div style={{ fontSize: 13, color: 'var(--ts)', marginTop: 2 }}>Passo 2 de 3 · Perfil e segmento</div></div>
                <button className="modal-close" onClick={() => setModal(false)}>✕</button>
              </div>
              <div className="modal-steps">
                <div className="ms-item"><div className="ms-dot done">✓</div><div className="ms-line done" /></div>
                <div className="ms-item"><div className="ms-dot act">2</div><div className="ms-line" /></div>
                <div className="ms-item"><div className="ms-dot pend">3</div></div>
              </div>
              <div className="form-group">
                <label className="form-label">Segmento de mercado</label>
                <select className="form-input" value={segmento} onChange={e => setSegmento(e.target.value)}>
                  {segmentos.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Perfil de aprovação</label>
                <div className="radio-group">
                  {(['rapido', 'socio', 'comite'] as const).map(v => (
                    <div key={v} className={`radio-opt${aprov === v ? ' sel' : ''}`} onClick={() => setAprov(v)}>
                      <div className="radio-dot" />
                      <div>
                        <div className="radio-label">{aprovLabels[v]}</div>
                        {v === 'comite' && <div className="radio-sub">⚠️ Alto risco de retrabalho</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Como chegou até você?</label>
                <select className="form-input" value={origem} onChange={e => setOrigem(e.target.value)}>
                  {origens.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <button className="btn bg-btn" onClick={() => setStep(1)}>← Voltar</button>
                <button className="btn bp" onClick={() => setStep(3)}>Próximo →</button>
              </div>
            </>
          )}

          {/* Step 3 - Confirmação */}
          {step === 3 && (
            <>
              <div className="modal-header">
                <div><div className="modal-title">Novo cliente</div><div style={{ fontSize: 13, color: 'var(--ts)', marginTop: 2 }}>Passo 3 de 3 · Confirmação</div></div>
                <button className="modal-close" onClick={() => setModal(false)}>✕</button>
              </div>
              <div className="modal-steps">
                <div className="ms-item"><div className="ms-dot done">✓</div><div className="ms-line done" /></div>
                <div className="ms-item"><div className="ms-dot done">✓</div><div className="ms-line done" /></div>
                <div className="ms-item"><div className="ms-dot act">3</div></div>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--b)', borderRadius: 'var(--rad)', padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--pl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: 'var(--p)' }}>{ini}</div>
                  <div><div style={{ fontSize: 16, fontWeight: 700 }}>{nome}</div><div style={{ fontSize: 13, color: 'var(--ts)' }}>{contato}</div></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                  {[['E-mail', email || '—'], ['WhatsApp', whatsapp || '—'], ['Segmento', segmento], ['Aprovação', aprovLabels[aprov]], ['Origem', origem]].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ts)' }}>{l}</span><span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {aprov === 'comite' && (
                <div className="alert alert-p" style={{ marginBottom: 20 }}>
                  ⚠️ <span style={{ fontSize: 13 }}><strong>Cliente com aprovação em comitê.</strong> Considere adicionar 30–40% de margem para cobrir retrabalho.</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                <button className="btn bg-btn" onClick={() => setStep(2)}>← Corrigir</button>
                <button className="btn bp" style={{ flex: 1, justifyContent: 'center' }} onClick={save} disabled={saving}>
                  {saving ? 'Salvando...' : '✓ Cadastrar cliente'}
                </button>
              </div>
            </>
          )}

          {/* Step 4 - Sucesso */}
          {step === 4 && (
            <div className="success-screen">
              <div className="success-icon">🚀</div>
              <div className="success-title">{nome} cadastrado!</div>
              <div className="success-sub">O cliente foi adicionado à sua carteira e já está disponível ao criar novos projetos.</div>
              <div style={{ background: 'var(--pl)', borderRadius: 'var(--rad)', padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--p)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 16 }}>{ini}</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--ts)' }}>{segmento}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn bg-btn" onClick={() => setModal(false)}>Fechar</button>
                <button className="btn bp" onClick={openModal}>+ Novo cliente</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
