import { createClient } from '@/lib/supabase-server'
import { fmtBRL, fmtSeconds } from '@/lib/types'
import Link from 'next/link'
import DashboardClient from './DashboardClient'
import TaskCheckbox from './TaskCheckbox'
import { Wallet, CheckSquare, FolderOpen, Timer, TrendingUp, Receipt } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Buscar dados em paralelo
  const [
    { data: profile },
    { data: tasks },
    { data: projects },
    { data: clients },
    { data: transactions },
    { data: timeEntries },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('tasks').select('*').eq('user_id', user.id),
    supabase.from('projects').select('*').eq('user_id', user.id),
    supabase.from('clients').select('*').eq('user_id', user.id),
    supabase.from('financial_transactions').select('*').eq('user_id', user.id),
    supabase.from('time_entries').select('*').eq('user_id', user.id),
  ])

  // Métricas do mês atual
  const now = new Date()
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const transacoesMes = (transactions || []).filter(t => t.data?.startsWith(mesAtual))
  const recebidoMes = transacoesMes.filter(t => t.tipo === 'entrada' && t.status === 'confirmado').reduce((s, t) => s + (t.valor || 0), 0)
  const despesasMes = transacoesMes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + (t.valor || 0), 0)
  const metaMensal = profile?.meta_mensal || 0
  const progressoMeta = metaMensal > 0 ? Math.min((recebidoMes / metaMensal) * 100, 100) : 0

  const horasMes = (timeEntries || [])
    .filter(te => te.data?.startsWith(mesAtual))
    .reduce((s, te) => s + (te.segundos || 0), 0)

  const tarefasPendentes = (tasks || []).filter(t => t.status !== 'co').length
  const tarefasConcluidas = (tasks || []).filter(t => t.status === 'co').length
  const projetosAtivos = (projects || []).filter(p => p.status === 'andamento').length

  // Tarefas recentes (5 últimas)
  const tarefasRecentes = [...(tasks || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // Projetos ativos
  const projetosAtivosLista = (projects || [])
    .filter(p => p.status === 'andamento')
    .slice(0, 4)

  // Transações recentes (5)
  const transacoesRecentes = [...(transactions || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="page">
      {/* Saudação */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Olá, {profile?.nome?.split(' ')[0] || 'você'}
        </h1>
        <p style={{ color: 'var(--ts)', fontSize: 14 }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Wallet size={13} /> Recebido no mês</div>
          <div className="metric-value" style={{ color: 'var(--g)' }}>{fmtBRL(recebidoMes)}</div>
          {metaMensal > 0 && (
            <>
              <div className="progress-bar" style={{ marginTop: 10, marginBottom: 6 }}>
                <div className="progress-fill green" style={{ width: `${progressoMeta}%` }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--ts)' }}>
                {progressoMeta.toFixed(0)}% da meta · {fmtBRL(metaMensal)}
              </div>
            </>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CheckSquare size={13} /> Tarefas</div>
          <div className="metric-value">{tarefasPendentes}</div>
          <div className="metric-change">{tarefasConcluidas} concluídas este mês</div>
        </div>

        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FolderOpen size={13} /> Projetos ativos</div>
          <div className="metric-value">{projetosAtivos}</div>
          <div className="metric-change">{(clients || []).length} clientes na carteira</div>
        </div>

        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Timer size={13} /> Horas no mês</div>
          <div className="metric-value">{Math.floor(horasMes / 3600)}h {Math.floor((horasMes % 3600) / 60)}m</div>
          <div className="metric-change">{fmtBRL(recebidoMes)} faturados</div>
        </div>
      </div>

      <div className="g12" style={{ marginBottom: 24 }}>
        {/* Projetos ativos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Projetos em andamento</span>
            <Link href="/projects" style={{ fontSize: 13, color: 'var(--p)', textDecoration: 'none' }}>Ver todos →</Link>
          </div>
          <div className="card-body">
            {projetosAtivosLista.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FolderOpen size={22} color="var(--o)" strokeWidth={1.5} /></div>
                <div className="empty-state-title">Nenhum projeto ativo</div>
                <div className="empty-state-sub">Crie um projeto e comece a registrar seu progresso</div>
                <Link href="/projects" className="btn bp btn-sm">+ Novo projeto</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {projetosAtivosLista.map(p => {
                  const etapas = p.etapas || ['Briefing', 'Criação', 'Revisão', 'Aprovação', 'Entrega']
                  const idx = etapas.indexOf(p.etapa_atual)
                  const prog = etapas.length > 1 ? (idx / (etapas.length - 1)) * 100 : 0
                  return (
                    <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="proj-card-hover" style={{ padding: '16px', border: '1px solid var(--b)', borderRadius: 'var(--rsm)', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
                          <div style={{ fontSize: 12, color: 'var(--ts)' }}>{p.client?.nome || '—'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${prog}%` }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--ts)', whiteSpace: 'nowrap' }}>{p.etapa_atual}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span className="tag">{p.etapa_atual}</span>
                          {p.valor > 0 && <span style={{ fontSize: 12, color: 'var(--g)', fontWeight: 600 }}>{fmtBRL(p.valor)}</span>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Financeiro recente */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Financeiro</span>
            <Link href="/financial" style={{ fontSize: 13, color: 'var(--p)', textDecoration: 'none' }}>Ver todos →</Link>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--gl)', borderRadius: 'var(--rsm)' }}>
              <div style={{ fontSize: 12, color: '#157040', marginBottom: 2 }}>Saldo do mês</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: recebidoMes - despesasMes >= 0 ? 'var(--g)' : 'var(--r)' }}>
                {fmtBRL(recebidoMes - despesasMes)}
              </div>
            </div>
            {transacoesRecentes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Receipt size={22} color="var(--o)" strokeWidth={1.5} /></div>
                <div className="empty-state-title">Sem movimentações</div>
                <div className="empty-state-sub">Registre recebimentos e despesas para acompanhar seu fluxo</div>
                <Link href="/financial" className="btn bp btn-sm">+ Registrar</Link>
              </div>
            ) : (
              transacoesRecentes.map(t => (
                <div key={t.id} className="fin-row">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: t.tipo === 'entrada' ? 'var(--gl)' : 'var(--rl)', flexShrink: 0 }}>
                    {t.tipo === 'entrada' ? <TrendingUp size={15} color="var(--g)" /> : <Receipt size={15} color="var(--r)" />}
                  </div>
                  <div className="fin-row-content">
                    <div className="fin-row-title">{t.descricao || (t.tipo === 'entrada' ? 'Recebimento' : 'Despesa')}</div>
                    <div className="fin-row-sub">{t.data ? t.data.split('-').reverse().join('/') : '—'}</div>
                  </div>
                  <div className={`fin-row-value ${t.tipo === 'entrada' ? 'pos' : 'neg'}`}>
                    {t.tipo === 'entrada' ? '+' : '-'}{fmtBRL(t.valor)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tarefas recentes */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Tarefas recentes</span>
          <Link href="/tasks" style={{ fontSize: 13, color: 'var(--p)', textDecoration: 'none' }}>Ver todas →</Link>
        </div>
        <div className="card-body">
          {tarefasRecentes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CheckSquare size={22} color="var(--o)" strokeWidth={1.5} /></div>
              <div className="empty-state-title">Nenhuma tarefa ainda</div>
              <div className="empty-state-sub">Adicione tarefas e use o timer para registrar seu tempo</div>
              <Link href="/tasks" className="btn bp btn-sm">+ Nova tarefa</Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Tarefa</th>
                    <th>Projeto</th>
                    <th>Status</th>
                    <th>Prioridade</th>
                  </tr>
                </thead>
                <tbody>
                  {tarefasRecentes.map(t => (
                    <tr key={t.id}>
                      <td>
                        <TaskCheckbox taskId={t.id} initialChecked={t.status === 'co'} />
                      </td>
                      <td style={{ fontWeight: 500, textDecoration: t.status === 'co' ? 'line-through' : 'none', color: t.status === 'co' ? 'var(--ts)' : 'inherit' }}>
                        {t.nome}
                      </td>
                      <td><span style={{ fontSize: 13, color: 'var(--ts)' }}>—</span></td>
                      <td>
                        <span className={`bdg ${t.status === 'co' ? 'bdg-g' : t.status === 'an' ? 'bdo' : 'bdgr'}`}>
                          {t.status === 'co' ? 'Concluída' : t.status === 'an' ? 'Em andamento' : 'Aguardando'}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: t.prioridade === 'a' ? 'var(--r)' : t.prioridade === 'b' ? 'var(--g)' : 'var(--p)' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <DashboardClient userId={user.id} />
    </div>
  )
}

