import { createClient } from '@/lib/supabase-server'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: rawTasks }, { data: projects }] = await Promise.all([
    supabase.from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('projects')
      .select('id, nome, cor, etapas, etapa_atual')
      .eq('user_id', user.id)
      .eq('status', 'andamento'),
  ])

  const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p]))
  const tasks = (rawTasks || []).map(t => ({
    ...t,
    project: t.project_id ? projectMap[t.project_id] ?? null : null,
  }))

  return <TasksClient userId={user.id} initialTasks={tasks || []} projects={projects || []} />
}
