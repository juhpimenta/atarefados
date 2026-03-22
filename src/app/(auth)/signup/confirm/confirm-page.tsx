'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ConfirmContent() {
  const params = useSearchParams()
  const email = params.get('email') || 'seu e-mail'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: 20,
    }}>
      <div style={{
        background: 'var(--s)', border: '1px solid var(--b)',
        borderRadius: 'var(--rad)', padding: 48,
        width: '100%', maxWidth: 420,
        boxShadow: 'var(--sh)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Confirme seu e-mail</h2>
        <p style={{ color: 'var(--ts)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Enviamos um link de confirmação para<br />
          <strong style={{ color: 'var(--t)' }}>{email}</strong><br /><br />
          Clique no link do e-mail para ativar sua conta e acessar o Atarefados.
        </p>
        <div style={{
          background: 'var(--pl)', borderRadius: 'var(--rsm)',
          padding: '14px 18px', marginBottom: 24, fontSize: 13, color: 'var(--p)',
        }}>
          💡 Não recebeu? Verifique a pasta de spam.
        </div>
        <Link href="/login" className="btn bp btn-full">
          Já confirmei → Entrar
        </Link>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  )
}
