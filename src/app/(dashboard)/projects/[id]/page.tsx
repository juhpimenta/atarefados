import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProjectDetailClient from './ProjectDetailClient'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: project }, { data: tasks }, { data: timeEntries }, { data: transactions }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('time_entries').select('*').eq('project_id', id).order('data', { ascending: false }),
    supabase.from('financial_transactions').select('*').eq('project_id', id).order('data', { ascending: false }),
  ])

  if (!project) notFound()

  let client = null
  if (project!.client_id) {
    const { data } = await supabase.from('clients').select('id, nome, email, whatsapp').eq('id', project!.client_id).single()
    client = data
  }
  const projectWithClient = { ...project, client }

  return (
    <ProjectDetailClient
      userId={user.id}
      project={projectWithClient}
      initialTasks={tasks || []}
      timeEntries={timeEntries || []}
      transactions={transactions || []}
    />
  )
}
