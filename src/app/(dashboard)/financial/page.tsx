import { createClient } from '@/lib/supabase-server'
import FinancialClient from './FinancialClient'

export default async function FinancialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [{ data: transactions }, { data: projects }, { data: clients }, { data: profile }] = await Promise.all([
    supabase.from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false }),
    supabase.from('projects').select('id, nome').eq('user_id', user.id),
    supabase.from('clients').select('id, nome').eq('user_id', user.id),
    supabase.from('profiles').select('meta_mensal').eq('id', user.id).single(),
  ])

  const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p]))
  const clientMap  = Object.fromEntries((clients  || []).map(c => [c.id, c]))
  const transactionsJoined = (transactions || []).map(t => ({
    ...t,
    project: t.project_id ? projectMap[t.project_id] ?? null : null,
    client:  t.client_id  ? clientMap[t.client_id]   ?? null : null,
  }))

  return (
    <FinancialClient
      userId={user.id}
      initialTransactions={transactionsJoined}
      projects={projects || []}
      clients={clients || []}
      metaMensal={profile?.meta_mensal || 0}
      mesAtual={mes}
    />
  )
}
