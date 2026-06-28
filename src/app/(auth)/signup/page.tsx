'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 6) { setErro('Senha deve ter ao menos 6 caracteres.'); return }
    setLoading(true); setErro('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    })
    if (error) {
      setErro(error.message === 'User already registered'
        ? 'Este e-mail já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }
    if (data.session) {
      router.push('/onboarding')
      router.refresh()
    } else {
      // Supabase requer confirmação de e-mail
      setSucesso(true)
      setLoading(false)
    }
  }

  if (sucesso) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Confirme seu e-mail</h2>
        <p style={{ color: 'var(--ts)', fontSize: 14 }}>Enviamos um link de confirmação para <strong>{email}</strong>.<br />Verifique sua caixa de entrada.</p>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '32px 0',
    }}>
      <div style={{
        background: 'var(--s)', border: '1px solid var(--b)', borderRadius: 'var(--rad)',
        padding: 48, width: 420, boxShadow: 'var(--sh)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 18, color: 'var(--p)', marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: 'var(--p)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>⚡</div>
          Atarefados
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Crie sua conta</h2>
        <p style={{ color: 'var(--ts)', fontSize: 14, marginBottom: 28 }}>Grátis para sempre. Sem cartão de crédito.</p>

        {erro && <div className="alert alert-r">{erro}</div>}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">Seu nome</label>
            <input type="text" className="form-input" required placeholder="Ex: João Silva" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input type="email" className="form-input" required placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input type="password" className="form-input" required placeholder="Mínimo 6 caracteres" value={senha} onChange={e => setSenha(e.target.value)} />
            <div className="form-help">Mínimo 6 caracteres</div>
          </div>
          <button type="submit" className="btn bp btn-full" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? <><span className="spinner" />Criando conta...</> : 'Criar conta grátis →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--ts)' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: 'var(--p)', fontWeight: 500, textDecoration: 'none' }}>Entrar</Link>
        </div>
      </div>
    </div>
  )
}
