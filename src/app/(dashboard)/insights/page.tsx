import { createClient } from '@/lib/supabase-server'
import { fmtBRL } from '@/lib/types'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const mesAnterior = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  const [{ data: tasks }, { data: projects }, { data: transactions }, { data: timeEntries }] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id),
    supabase.from('projects').select('*, client:clients(id, nome)').eq('user_id', user.id),
    supabase.from('financial_transactions').select('*').eq('user_id', user.id),
    supabase.from('time_entries').select('*').eq('user_id', user.id),
  ])

  const t = tasks || [], p = projects || [], tx = transactions || [], te = timeEntries || []

  // Taxa de conclusão
  const total = t.length
  const concluidas = t.filter(t => t.status === 'co').length
  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0

  // Receita mensal
  const recMes = tx.filter(x => x.tipo === 'entrada' && x.data?.startsWith(mesAtual)).reduce((s, x) => s + x.valor, 0)
  const recMesAnt = tx.filter(x => x.tipo === 'entrada' && x.data?.startsWith(mesAnterior)).reduce((s, x) => s + x.valor, 0)
  const varReceita = recMesAnt > 0 ? ((recMes - recMesAnt) / recMesAnt * 100).toFixed(0) : null

  // Horas por projeto
  const hrsProj: Record<string, number> = {}
  te.forEach(e => { if (e.project_id) hrsProj[e.project_id] = (hrsProj[e.project_id] || 0) + e.segundos })
  const topProj = Object.entries(hrsProj)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, seg]) => ({ id, horas: seg / 3600, projeto: p.find(x => x.id === id) }))

  // Rentabilidade por projeto
  const rentabilidade = p.filter(pr => pr.valor > 0).map(pr => {
    const hs = te.filter(e => e.project_id === pr.id).reduce((s, e) => s + e.segundos, 0) / 3600
    const hrVal = hs > 0 ? pr.valor / hs : 0
    return { ...pr, horas: hs, valorHora: hrVal }
  }).sort((a, b) => b.valorHora - a.valorHora).slice(0, 5)

  // Distribuição de tarefas por status
  const tAg = t.filter(x => x.status === 'ag').length
  const tAn = t.filter(x => x.status === 'an').length
  const tCo = t.filter(x => x.status === 'co').length

  // Projetos por status
  const pAnd = p.filter(x => x.status === 'andamento').length
  const pCon = p.filter(x => x.status === 'concluido').length

  // Total horas registradas
  const totalHoras = te.reduce((s, e) => s + e.segundos, 0) / 3600
  const horasMes = te.filter(e => e.data?.startsWith(mesAtual)).reduce((s, e) => s + e.segundos, 0) / 3600

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Insights</h1>
        <p style={{ color: 'var(--ts)', fontSize: 13 }}>Padrões do seu trabalho baseados em dados reais</p>
      </div>

      {/* Métricas gerais */}
      <div className="metrics-grid" style={{ marginBottom: 28 }}>
        <div className="metric-card">
          <div className="metric-label">📊 Taxa de conclusão</div>
          <div className="metric-value">{taxaConclusao}%</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${taxaConclusao}%` }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--ts)', marginTop: 6 }}>{concluidas} de {total} tarefas</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">💰 Receita este mês</div>
          <div className="metric-value" style={{ color: 'var(--g)' }}>{fmtBRL(recMes)}</div>
          {varReceita && (
            <div className={`metric-change ${parseInt(varReceita) >= 0 ? 'up' : 'down'}`}>
              {parseInt(varReceita) >= 0 ? '↑' : '↓'} {Math.abs(parseInt(varReceita))}% vs mês anterior
            </div>
          )}
        </div>
        <div className="metric-card">
          <div className="metric-label">⏱ Horas este mês</div>
          <div className="metric-value">{horasMes.toFixed(1)}h</div>
          <div style={{ fontSize: 12, color: 'var(--ts)' }}>{totalHoras.toFixed(1)}h registradas no total</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">📁 Projetos</div>
          <div className="metric-value">{pAnd}</div>
          <div style={{ fontSize: 12, color: 'var(--ts)' }}>{pCon} concluídos · {p.length} total</div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 24 }}>
        {/* Distribuição de tarefas */}
        <div className="card">
          <div className="card-header"><span className="card-title">Distribuição de tarefas</span></div>
          <div className="card-body">
            {[
              { label: 'Concluídas', count: tCo, color: 'var(--g)', total },
              { label: 'Em andamento', count: tAn, color: 'var(--o)', total },
              { label: 'Aguardando', count: tAg, color: 'var(--b)', total },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                  <span style={{ color: 'var(--ts)' }}>{item.count} ({item.total > 0 ? Math.round(item.count / item.total * 100) : 0}%)</span>
                </div>
                <div className="progress-bar">
                  <div style={{ height: '100%', borderRadius: 3, background: item.color, width: `${item.total > 0 ? (item.count / item.total * 100) : 0}%`, transition: 'width .4s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projetos mais trabalhados */}
        <div className="card">
          <div className="card-header"><span className="card-title">Projetos por horas</span></div>
          <div className="card-body">
            {topProj.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div>Nenhum registro de tempo ainda</div>
              </div>
            ) : (
              topProj.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--b)' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'var(--pl)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'var(--p)', flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.projeto?.nome || 'Projeto removido'}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.horas.toFixed(1)}h</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Rentabilidade */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">💡 Rentabilidade por projeto (R$/hora)</span>
        </div>
        <div className="card-body">
          {rentabilidade.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div>Registre horas e valores nos projetos para ver a rentabilidade</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Projeto</th>
                    <th>Cliente</th>
                    <th>Valor total</th>
                    <th>Horas</th>
                    <th>R$/hora</th>
                    <th>Avaliação</th>
                  </tr>
                </thead>
                <tbody>
                  {rentabilidade.map(pr => (
                    <tr key={pr.id}>
                      <td style={{ fontWeight: 500 }}>{pr.nome}</td>
                      <td style={{ fontSize: 13, color: 'var(--ts)' }}>{(pr as any).client?.nome || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{fmtBRL(pr.valor)}</td>
                      <td style={{ color: 'var(--ts)' }}>{pr.horas.toFixed(1)}h</td>
                      <td style={{ fontWeight: 700, color: pr.valorHora >= 100 ? 'var(--g)' : pr.valorHora >= 50 ? 'var(--y)' : 'var(--r)' }}>
                        {fmtBRL(pr.valorHora)}
                      </td>
                      <td>
                        <span className={`bdg ${pr.valorHora >= 100 ? 'bdg-g' : pr.valorHora >= 50 ? 'bdy' : 'bdr'}`}>
                          {pr.valorHora >= 100 ? '🚀 Excelente' : pr.valorHora >= 50 ? '⚠️ Regular' : '🔴 Abaixo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Insights textuais */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {recMes > recMesAnt && recMesAnt > 0 && (
          <div style={{ background: 'var(--s)', border: '1px solid var(--b)', borderRadius: 'var(--rad)', padding: '20px 22px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ fontSize: 22 }}>📈</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ts)', marginBottom: 4 }}>Crescimento</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Receita crescendo mês a mês</div>
              <div style={{ fontSize: 13, color: 'var(--ts)' }}>
                Você faturou {fmtBRL(recMes)} este mês, {varReceita}% a mais que o mês anterior ({fmtBRL(recMesAnt)}). Continue assim!
              </div>
            </div>
          </div>
        )}
        {tAg > tAn + tCo && (
          <div style={{ background: 'var(--s)', border: '1px solid var(--b)', borderRadius: 'var(--rad)', padding: '20px 22px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ fontSize: 22 }}>⚠️</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ts)', marginBottom: 4 }}>Atenção</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Muitas tarefas aguardando</div>
              <div style={{ fontSize: 13, color: 'var(--ts)' }}>
                Você tem {tAg} tarefas aguardando. Tente mover algumas para "Em andamento" para manter o ritmo.
              </div>
            </div>
          </div>
        )}
        {totalHoras === 0 && (
          <div style={{ background: 'var(--s)', border: '1px solid var(--b)', borderRadius: 'var(--rad)', padding: '20px 22px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ fontSize: 22 }}>💡</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ts)', marginBottom: 4 }}>Dica</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Comece a registrar seu tempo</div>
              <div style={{ fontSize: 13, color: 'var(--ts)' }}>
                Use o timer nas tarefas para descobrir quanto tempo realmente gasta em cada projeto e melhorar sua precificação.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
