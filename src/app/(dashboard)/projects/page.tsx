import { createClient } from '@/lib/supabase-server'
import ProjectsClient from './ProjectsClient'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: rawProjects }, { data: clients }] = await Promise.all([
    supabase.from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('clients').select('id, nome').eq('user_id', user.id).eq('status', 'ativo'),
  ])

  const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c]))
  const projects = (rawProjects || []).map(p => ({
    ...p,
    client: p.client_id ? clientMap[p.client_id] ?? null : null,
  }))

  return <ProjectsClient userId={user.id} initialProjects={projects || []} clients={clients || []} />
}
