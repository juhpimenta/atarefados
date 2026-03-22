import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Página não encontrada</h1>
        <p style={{ color: 'var(--ts)', marginBottom: 28 }}>O recurso que você procura não existe ou foi removido.</p>
        <Link href="/dashboard" className="btn bp">← Voltar ao Dashboard</Link>
      </div>
    </div>
  )
}
