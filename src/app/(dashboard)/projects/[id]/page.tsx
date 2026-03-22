import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProjectDetailClient from './ProjectDetailClient'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: project }, { data: tasks }, { data: timeEntries }, { data: transactions }] = await Promise.all([
    supabase.from('projects').select('*, client:clients(id, nome, email, whatsapp)').eq('id', params.id).eq('user_id', user.id).single(),
    supabase.from('tasks').select('*').eq('project_id', params.id).order('created_at', { ascending: false }),
    supabase.from('time_entries').select('*').eq('project_id', params.id).order('data', { ascending: false }),
    supabase.from('financial_transactions').select('*').eq('project_id', params.id).order('data', { ascending: false }),
  ])

  if (!project) notFound()

  return (
    <ProjectDetailClient
      userId={user.id}
      project={project}
      initialTasks={tasks || []}
      timeEntries={timeEntries || []}
      transactions={transactions || []}
    />
  )
}
