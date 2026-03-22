'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import { initials, fmtBRL } from '@/lib/types'

const profissoes = [
  { value: 'designer', label: '🎨 Designer' },
  { value: 'dev', label: '💻 Desenvolvedor' },
  { value: 'redator', label: '✍️ Redator / Copy' },
  { value: 'video', label: '🎬 Vídeo / Foto' },
  { value: 'marketing', label: '📣 Marketing' },
  { value: 'outro', label: '⚡ Outro' },
]

export default function SettingsClient({ userId, profile }: { userId: string; profile: Profile | null }) {
  const router = useRouter()
  const supabase = createClient()
  const [nome, setNome] = useState(profile?.nome || '')
  const [profissao, setProfissao] = useState(profile?.profissao || '')
  const [meta, setMeta] = useState(profile?.meta_mensal?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('perfil')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')

  async function savePerfil() {
    setSaving(true)
    await supabase.from('profiles').update({
      nome,
      profissao,
      meta_mensal: parseFloat(meta) || 0,
    }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function changePwd() {
    if (senhaNova.length < 6) { setPwdMsg('Senha deve ter ao menos 6 caracteres.'); return }
    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: senhaNova })
    if (error) { setPwdMsg('Erro ao alterar senha.') }
    else { setPwdMsg('✅ Senha alterada com sucesso!'); setSenhaAtual(''); setSenhaNova('') }
    setSavingPwd(false)
  }

  async function deleteAccount() {
    if (!confirm('⚠️ Tem certeza? Todos os seus dados serão excluídos permanentemente. Esta ação não pode ser desfeita.')) return
    await supabase.auth.signOut()
    router.push('/')
  }

  const ini = initials(nome || 'U')

  return (
    <div style={{ padding: 32, maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Configurações</h1>
        <p style={{ color: 'var(--ts)', fontSize: 13 }}>Perfil e preferências</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[['perfil', '👤 Perfil'], ['seguranca', '🔒 Segurança'], ['conta', '⚙️ Conta']].map(([v, l]) => (
          <button key={v} className={`tab-btn${tab === v ? ' active' : ''}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {/* Perfil */}
      {tab === 'perfil' && (
        <div className="card">
          <div className="card-body">
            {/* Avatar */}
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

            {saved && <div className="alert alert-g">✅ Perfil salvo com sucesso!</div>}

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

      {/* Segurança */}
      {tab === 'seguranca' && (
        <div className="card">
          <div className="card-body">
            <div style={{ fontWeight: 600, marginBottom: 20 }}>Alterar senha</div>
            {pwdMsg && (
              <div className={`alert ${pwdMsg.includes('✅') ? 'alert-g' : 'alert-r'}`} style={{ marginBottom: 16 }}>{pwdMsg}</div>
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
            <button className="btn btn-danger" onClick={deleteAccount}>🗑 Encerrar conta</button>
          </div>
        </div>
      )}
    </div>
  )
}
