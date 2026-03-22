'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })

    console.log('Login result:', { data, error })

    if (error) {
      console.error('Login error:', error.message)
      if (error.message.includes('Invalid login credentials')) {
        setErro('E-mail ou senha incorretos.')
      } else if (error.message.includes('Email not confirmed')) {
        setErro('E-mail não confirmado. Verifique sua caixa de entrada.')
      } else {
        setErro(`Erro: ${error.message}`)
      }
      setLoading(false)
      return
    }

    if (data?.session) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setErro('Não foi possível iniciar sessão. Tente novamente.')
      setLoading(false)
    }
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

        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Bem-vindo de volta</h2>
        <p style={{ color: 'var(--ts)', fontSize: 14, marginBottom: 28 }}>
          Entre na sua conta para continuar
        </p>

        {erro && (
          <div className="alert alert-r" style={{ marginBottom: 20 }}>
            ⚠️ {erro}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="form-input"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              required
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn bp btn-full"
            style={{ marginTop: 8 }}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Entrando...</>
              : 'Entrar →'
            }
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--ts)' }}>
          Não tem conta?{' '}
          <Link href="/signup" style={{ color: 'var(--p)', fontWeight: 500, textDecoration: 'none' }}>
            Criar conta grátis
          </Link>
        </div>
      </div>
    </div>
  )
}
