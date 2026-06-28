'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Palette, Laptop, PenLine, Film, Megaphone, Zap, User, Users, Building2, Rocket } from 'lucide-react'

const profissoes = [
  { value: 'designer',   icon: Palette,   title: 'Designer',          sub: 'UI/UX, gráfico, motion' },
  { value: 'dev',        icon: Laptop,    title: 'Desenvolvedor',     sub: 'Web, mobile, sistemas' },
  { value: 'redator',    icon: PenLine,   title: 'Redator / Copy',    sub: 'Conteúdo, SEO, social' },
  { value: 'video',      icon: Film,      title: 'Vídeo / Foto',      sub: 'Produção audiovisual' },
  { value: 'marketing',  icon: Megaphone, title: 'Marketing',         sub: 'Tráfego, gestão de social' },
  { value: 'outro',      icon: Zap,       title: 'Outro',             sub: 'Consultoria, gestão, etc' },
]

const tamanhos = [
  { value: 'solo',     icon: User,      title: 'Só eu',          sub: 'Freelancer independente' },
  { value: 'pequena',  icon: Users,     title: 'Pequena equipe', sub: '2 a 5 pessoas' },
  { value: 'media',    icon: Building2, title: 'Agência',        sub: '6 ou mais pessoas' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [profissao, setProfissao] = useState('')
  const [tamanho, setTamanho] = useState('')
  const [nomeProjeto, setNomeProjeto] = useState('')
  const [meta, setMeta] = useState('')
  const [loading, setLoading] = useState(false)

  async function finalizar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        profissao,
        tamanho,
        meta_mensal: parseFloat(meta.replace(/\D/g, '')) || 0,
        onboarding: true,
      }).eq('id', user.id)
    }
    router.push('/dashboard')
    router.refresh()
  }

  const steps = ['profissao', 'tamanho', 'meta', 'concluir']

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px 16px',
    }}>
      <div style={{
        background: 'var(--s)', border: '1px solid var(--b)', borderRadius: 'var(--rad)',
        padding: 48, width: '100%', maxWidth: 540, boxShadow: 'var(--sh)',
      }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              height: 4, flex: 1, borderRadius: 2,
              background: i < step - 1 ? 'var(--p)' : i === step - 1 ? 'var(--pm)' : 'var(--b)',
              transition: 'background .3s',
            }} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ts)', marginBottom: 24 }}>Passo {step} de {steps.length}</div>

        {/* Step 1 - Profissão */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Qual é a sua área?</h2>
            <p style={{ color: 'var(--ts)', fontSize: 14, marginBottom: 24 }}>Isso nos ajuda a personalizar sua experiência.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profissoes.map(p => {
                const Icon = p.icon
                return (
                  <div key={p.value}
                    className={`radio-opt${profissao === p.value ? ' sel' : ''}`}
                    onClick={() => { setProfissao(p.value); setTimeout(() => setStep(2), 350) }}
                  >
                    <Icon size={22} color="var(--p)" />
                    <div>
                      <div className="radio-label">{p.title}</div>
                      <div className="radio-sub">{p.sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Step 2 - Tamanho */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Como você trabalha?</h2>
            <p style={{ color: 'var(--ts)', fontSize: 14, marginBottom: 24 }}>Somos freelancers, duplas ou agências — sem julgamento.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tamanhos.map(t => {
                const Icon = t.icon
                return (
                  <div key={t.value}
                    className={`radio-opt${tamanho === t.value ? ' sel' : ''}`}
                    onClick={() => { setTamanho(t.value); setTimeout(() => setStep(3), 350) }}
                  >
                    <Icon size={22} color="var(--p)" />
                    <div>
                      <div className="radio-label">{t.title}</div>
                      <div className="radio-sub">{t.sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button className="btn bg-btn btn-sm" style={{ marginTop: 16 }} onClick={() => setStep(1)}>← Voltar</button>
          </>
        )}

        {/* Step 3 - Meta */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Qual é sua meta mensal?</h2>
            <p style={{ color: 'var(--ts)', fontSize: 14, marginBottom: 24 }}>Usaremos isso para acompanhar seu progresso no financeiro.</p>
            <div className="form-group">
              <label className="form-label">Meta de faturamento</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ts)', fontWeight: 500 }}>R$</span>
                <input
                  type="number" className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="0,00"
                  value={meta} onChange={e => setMeta(e.target.value)}
                />
              </div>
              <div className="form-help">Pode alterar depois em Configurações</div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 8 }}>
              <button className="btn bg-btn" onClick={() => setStep(2)}>← Voltar</button>
              <button className="btn bp" onClick={() => setStep(4)}>Continuar →</button>
            </div>
          </>
        )}

        {/* Step 4 - Conclusão */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Rocket size={48} color="var(--p)" strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Tudo pronto!</h2>
            <p style={{ color: 'var(--ts)', fontSize: 14, marginBottom: 32, lineHeight: 1.7 }}>
              Sua conta está configurada. Você pode criar seu primeiro projeto e começar a acompanhar seu trabalho agora mesmo.
            </p>
            <button className="btn bp btn-lg btn-full" onClick={finalizar} disabled={loading}>
              {loading ? <><span className="spinner" />Preparando...</> : 'Entrar no Atarefados →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
