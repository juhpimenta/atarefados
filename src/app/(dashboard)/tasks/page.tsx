import { createClient } from '@/lib/supabase-server'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase.from('tasks')
      .select('*, project:projects(id, nome, cor)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('projects')
      .select('id, nome, etapas, etapa_atual')
      .eq('user_id', user.id)
      .eq('status', 'andamento'),
  ])

  return <TasksClient userId={user.id} initialTasks={tasks || []} projects={projects || []} />
}
