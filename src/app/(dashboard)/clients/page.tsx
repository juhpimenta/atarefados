import { createClient } from '@/lib/supabase-server'
import ClientsClient from './ClientsClient'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Buscar clientes com contagem de projetos
  const { data: clients } = await supabase
    .from('clients')
    .select(`
      *,
      projects:projects(id, valor, status)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const clientsEnriched = (clients || []).map(c => ({
    ...c,
    _projects_count: c.projects?.length || 0,
    _total_faturado: (c.projects || []).reduce((s: number, p: any) => s + (p.valor || 0), 0),
  }))

  return <ClientsClient userId={user.id} initialClients={clientsEnriched} />
}
