'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!nome.trim()) { setErro('Informe seu nome.'); return }
    if (!email.trim()) { setErro('Informe seu e-mail.'); return }
    if (senha.length < 6) { setErro('A senha deve ter ao menos 6 caracteres.'); return }

    setLoading(true)

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: { nome: nome.trim() },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    })

    if (error) {
      console.error('Signup error:', error)
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setErro('Este e-mail já está cadastrado. Tente fazer login.')
      } else if (error.message.includes('Invalid email')) {
        setErro('E-mail inválido. Verifique e tente novamente.')
      } else if (error.message.includes('Password')) {
        setErro('Senha fraca. Use ao menos 6 caracteres.')
      } else {
        setErro(`Erro: ${error.message}`)
      }
      setLoading(false)
      return
    }

    if (data?.user) {
      // Criar perfil manualmente caso o trigger não funcione
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          nome: nome.trim(),
          onboarding: false,
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('Profile error:', profileError)
      }

      // Verificar se precisa confirmar e-mail
      if (data.session) {
        // Já está logado (confirmação desativada)
        router.push('/onboarding')
        router.refresh()
      } else {
        // Precisa confirmar e-mail
        router.push(`/signup/confirm?email=${encodeURIComponent(email)}`)
      }
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '32px 16px',
    }}>
      <div style={{
        background: 'var(--s)', border: '1px solid var(--b)',
        borderRadius: 'var(--rad)', padding: '48px',
        width: '100%', maxWidth: 420, boxShadow: 'var(--sh)',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontWeight: 700, fontSize: 18, color: 'var(--p)', marginBottom: 32,
        }}>
          <div style={{
            width: 36, height: 36, background: 'var(--p)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>⚡</div>
          Atarefados
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Crie sua conta</h2>
        <p style={{ color: 'var(--ts)', fontSize: 14, marginBottom: 28 }}>
          Grátis para sempre. Sem cartão de crédito.
        </p>

        {erro && (
          <div className="alert alert-r" style={{ marginBottom: 20 }}>
            ⚠️ {erro}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">Seu nome</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: João Silva"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              minLength={6}
            />
            <div className="form-help">Mínimo 6 caracteres</div>
          </div>

          <button
            type="submit"
            className="btn bp btn-full"
            style={{ marginTop: 8 }}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Criando conta...</>
              : 'Criar conta grátis →'
            }
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--ts)' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: 'var(--p)', fontWeight: 500, textDecoration: 'none' }}>
            Entrar
          </Link>
        </div>
      </div>
    </div>
  )
}
