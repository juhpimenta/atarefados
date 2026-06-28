'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import { initials, fmtBRL } from '@/lib/types'
import { User, Tag, Lock, Settings, Trash2, Palette, Laptop, PenLine, Film, Megaphone, Zap, X } from 'lucide-react'

const profissoes = [
  { value: 'designer',   label: 'Designer',       icon: Palette },
  { value: 'dev',        label: 'Desenvolvedor',  icon: Laptop },
  { value: 'redator',    label: 'Redator / Copy', icon: PenLine },
  { value: 'video',      label: 'Vídeo / Foto',   icon: Film },
  { value: 'marketing',  label: 'Marketing',      icon: Megaphone },
  { value: 'outro',      label: 'Outro',          icon: Zap },
]

export default function SettingsClient({ userId, profile }: { userId: string; profile: Profile | null }) {
  const router = useRouter()
  const supabase = createClient()
  const [nome, setNome] = useState(profile?.nome || '')
  const [profissao, setProfissao] = useState(profile?.profissao || '')
  const [meta, setMeta] = useState(profile?.meta_mensal?.toString() || '')
  const [valorHora, setValorHora] = useState((profile as any)?.valor_hora?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('perfil')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')

  const tiposDefault = ['Design', 'Desenvolvimento', 'Redação', 'Revisão', 'Reunião', 'Pesquisa']
  const [tipos, setTipos] = useState<string[]>((profile as any)?.tipos_tarefa || tiposDefault)
  const [novoTipo, setNovoTipo] = useState('')
  const [savingTipos, setSavingTipos] = useState(false)
  const [tiposSaved, setTiposSaved] = useState(false)

  async function addTipo() {
    const t = novoTipo.trim()
    if (!t || tipos.includes(t)) return
    setTipos(prev => [...prev, t])
    setNovoTipo('')
  }

  function removeTipo(t: string) {
    setTipos(prev => prev.filter(x => x !== t))
  }

  async function saveTipos() {
    setSavingTipos(true)
    await supabase.from('profiles').update({ tipos_tarefa: tipos } as any).eq('id', userId)
    setSavingTipos(false)
    setTiposSaved(true)
    setTimeout(() => setTiposSaved(false), 2000)
  }

  async function savePerfil() {
    setSaving(true)
    setSaved(false)
    const { error } = await supabase.from('profiles').update({
      nome,
      profissao,
      meta_mensal: parseFloat(meta) || 0,
    }).eq('id', userId)
    if (error) { alert('Erro ao salvar perfil: ' + error.message); setSaving(false); return }
    if (valorHora) {
      await supabase.from('profiles').update({ valor_hora: parseFloat(valorHora) || 0 } as any).eq('id', userId)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  async function changePwd() {
    if (senhaNova.length < 6) { setPwdMsg('Senha deve ter ao menos 6 caracteres.'); return }
    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: senhaNova })
    if (error) { setPwdMsg('Erro ao alterar senha.') }
    else { setPwdMsg('Senha alterada com sucesso!'); setSenhaAtual(''); setSenhaNova('') }
    setSavingPwd(false)
  }

  async function deleteAccount() {
    if (!confirm('⚠️ Tem certeza? Todos os seus dados serão excluídos permanentemente. Esta ação não pode ser desfeita.')) return
    await supabase.auth.signOut()
    router.push('/')
  }

  const ini = initials(nome || 'U')

  const tabs = [
    { value: 'perfil',    label: 'Perfil',            icon: User },
    { value: 'tipos',     label: 'Tipos de tarefa',   icon: Tag },
    { value: 'seguranca', label: 'Segurança',          icon: Lock },
    { value: 'conta',     label: 'Conta',              icon: Settings },
  ]

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Configurações</h1>
        <p style={{ color: 'var(--ts)', fontSize: 13 }}>Perfil e preferências</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button key={value} className={`tab-btn${tab === value ? ' active' : ''}`} onClick={() => setTab(value)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Perfil */}
      {tab === 'perfil' && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'var(--p)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 22, fontWeight: 700,
              }}>{ini}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{nome || 'Usuário'}</div>
                <div style={{ fontSize: 13, color: 'var(--ts)' }}>{profile?.email}</div>
              </div>
            </div>

            {saved && <div className="alert alert-g">Perfil salvo com sucesso!</div>}

            <div className="form-group">
              <label className="form-label">Nome</label>
              <input className="form-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="form-group">
              <label className="form-label">Profissão</label>
              <select className="form-input" value={profissao} onChange={e => setProfissao(e.target.value)}>
                <option value="">— Selecionar —</option>
                {profissoes.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Valor/hora (R$)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ts)', fontWeight: 500 }}>R$</span>
                <input className="form-input" style={{ paddingLeft: 40 }} type="number" placeholder="0,00" value={valorHora} onChange={e => setValorHora(e.target.value)} />
              </div>
              {valorHora && <div className="form-help">Sua taxa horária: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valorHora) || 0)}/h</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Meta mensal de faturamento</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ts)', fontWeight: 500 }}>R$</span>
                <input className="form-input" style={{ paddingLeft: 40 }} type="number" placeholder="0,00" value={meta} onChange={e => setMeta(e.target.value)} />
              </div>
              {meta && <div className="form-help">Meta: {fmtBRL(parseFloat(meta) || 0)}/mês</div>}
            </div>
            <button className="btn bp" onClick={savePerfil} disabled={saving}>
              {saving ? 'Salvando...' : '✓ Salvar alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Tipos de tarefa */}
      {tab === 'tipos' && (
        <div className="card">
          <div className="card-body">
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Tipos de tarefa</div>
            <p style={{ color: 'var(--ts)', fontSize: 13, marginBottom: 20 }}>
              Defina os tipos de tarefa que você realiza. Use para categorizar e estimar o tempo com mais precisão.
            </p>

            {tiposSaved && <div className="alert alert-g" style={{ marginBottom: 16 }}>Tipos salvos com sucesso!</div>}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {tipos.map(t => (
                <div key={t} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--pl)', borderRadius: 8, padding: '6px 12px',
                  fontSize: 14, fontWeight: 500,
                }}>
                  <span>{t}</span>
                  <button onClick={() => removeTipo(t)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--r)', fontSize: 14, padding: 0, lineHeight: 1,
                    display: 'flex', alignItems: 'center',
                  }}><X size={13} /></button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input
                className="form-input"
                placeholder="Ex: Identidade Visual, Motion, Consultoria..."
                value={novoTipo}
                onChange={e => setNovoTipo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTipo()}
                style={{ flex: 1 }}
              />
              <button className="btn bs" onClick={addTipo} disabled={!novoTipo.trim()}>+ Adicionar</button>
            </div>

            <button className="btn bp" onClick={saveTipos} disabled={savingTipos}>
              {savingTipos ? 'Salvando...' : '✓ Salvar tipos'}
            </button>
          </div>
        </div>
      )}

      {/* Segurança */}
      {tab === 'seguranca' && (
        <div className="card">
          <div className="card-body">
            <div style={{ fontWeight: 600, marginBottom: 20 }}>Alterar senha</div>
            {pwdMsg && (
              <div className={`alert ${pwdMsg.includes('sucesso') ? 'alert-g' : 'alert-r'}`} style={{ marginBottom: 16 }}>{pwdMsg}</div>
            )}
            <div className="form-group">
              <label className="form-label">Nova senha</label>
              <input type="password" className="form-input" placeholder="Mínimo 6 caracteres" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} />
            </div>
            <button className="btn bp" onClick={changePwd} disabled={savingPwd || !senhaNova}>
              {savingPwd ? 'Alterando...' : 'Alterar senha'}
            </button>
          </div>
        </div>
      )}

      {/* Conta */}
      {tab === 'conta' && (
        <div className="card">
          <div className="card-body">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Informações da conta</div>
            <div style={{ fontSize: 14, color: 'var(--ts)', marginBottom: 24 }}>
              <div style={{ marginBottom: 8 }}><strong>E-mail:</strong> {profile?.email}</div>
              <div style={{ marginBottom: 8 }}><strong>Membro desde:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '—'}</div>
            </div>

            <hr className="divider" />

            <div style={{ fontWeight: 600, color: 'var(--r)', marginBottom: 8 }}>Zona de perigo</div>
            <p style={{ fontSize: 13, color: 'var(--ts)', marginBottom: 16 }}>
              Ao excluir sua conta, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
            </p>
            <button className="btn btn-danger" onClick={deleteAccount} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Trash2 size={14} /> Encerrar conta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
