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
      .select('*, project:projects(id, nome), client:clients(id, nome)')
      .eq('user_id', user.id)
      .order('data', { ascending: false }),
    supabase.from('projects').select('id, nome').eq('user_id', user.id),
    supabase.from('clients').select('id, nome').eq('user_id', user.id),
    supabase.from('profiles').select('meta_mensal').eq('id', user.id).single(),
  ])

  return (
    <FinancialClient
      userId={user.id}
      initialTransactions={transactions || []}
      projects={projects || []}
      clients={clients || []}
      metaMensal={profile?.meta_mensal || 0}
      mesAtual={mes}
    />
  )
}
