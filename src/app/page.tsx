import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--s)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid var(--b)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 20, color: 'var(--p)' }}>
          <div style={{
            width: 36, height: 36, background: 'var(--p)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18,
          }}>⚡</div>
          Atarefados
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" className="btn bg-btn">Entrar</Link>
          <Link href="/signup" className="btn bp">Começar grátis →</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '80px 48px 60px', maxWidth: 760, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--pl)', color: 'var(--p)',
          padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, marginBottom: 24,
        }}>
          ✨ Feito para freelancers e agências brasileiras
        </div>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif", fontSize: 52, lineHeight: 1.15, marginBottom: 20,
        }}>
          Trabalhe menos,<br />
          <em style={{ fontStyle: 'italic', color: 'var(--p)' }}>entregue mais.</em>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--ts)', maxWidth: 520, marginBottom: 36, lineHeight: 1.7 }}>
          Gerencie projetos, controle horas, acompanhe recebimentos e ganhe insights reais sobre sua produtividade — tudo em um só lugar.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/signup" className="btn bp btn-lg">Criar conta gratuita →</Link>
          <Link href="/login" className="btn bg-btn btn-lg">Ver demonstração</Link>
        </div>
      </div>

      {/* FEATURES */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
        padding: '60px 48px', maxWidth: 1100, margin: '0 auto',
      }}>
        {[
          { icon: '✅', title: 'Tarefas com Timer', desc: 'Organize suas tarefas por projeto e inicie o cronômetro com um clique. Registre horas automaticamente.' },
          { icon: '📁', title: 'Projetos por etapas', desc: 'Briefing → Criação → Revisão → Aprovação → Entrega. Visualize o progresso de cada projeto.' },
          { icon: '👥', title: 'Gestão de clientes', desc: 'Perfil de aprovação, segmento e histórico de cada cliente. Saiba com quem você está trabalhando.' },
          { icon: '💰', title: 'Controle financeiro', desc: 'Registre recebimentos e despesas, acompanhe a meta mensal e visualize o fluxo de caixa.' },
          { icon: '💡', title: 'Insights inteligentes', desc: 'Descubra quais projetos são mais rentáveis, seus horários de pico e onde melhorar a precificação.' },
          { icon: '⏱', title: 'Controle de horas', desc: 'Compare horas estimadas com realizadas. Pare de perder dinheiro com projetos sem controle de tempo.' },
        ].map((f, i) => (
          <div key={i} style={{
            background: 'var(--bg)', border: '1px solid var(--b)',
            borderRadius: 'var(--rad)', padding: 28,
          }}>
            <div style={{
              width: 44, height: 44, background: 'var(--pl)', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, fontSize: 20,
            }}>{f.icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--ts)', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA FOOTER */}
      <div style={{
        textAlign: 'center', padding: '60px 48px',
        borderTop: '1px solid var(--b)', background: 'var(--pl)',
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Pronto para organizar sua vida freelancer?</h2>
        <p style={{ color: 'var(--ts)', marginBottom: 28, fontSize: 16 }}>Crie sua conta grátis em menos de 1 minuto.</p>
        <Link href="/signup" className="btn bp btn-lg">Começar agora — é grátis</Link>
      </div>

      <footer style={{ textAlign: 'center', padding: 24, color: 'var(--ts)', fontSize: 13, borderTop: '1px solid var(--b)' }}>
        © 2026 Atarefados · Feito com ❤️ para freelancers brasileiros
      </footer>
    </div>
  )
}
