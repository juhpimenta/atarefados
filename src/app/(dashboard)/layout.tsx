import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Sidebar from '@/components/layout/Sidebar'
import MobileTopbar from '@/components/layout/MobileTopbar'
import BottomNav from '@/components/layout/BottomNav'
import GlobalTimer from '@/components/layout/GlobalTimer'
import QuickTaskModal from '@/components/tasks/QuickTaskModal'
import { TimerProvider } from '@/lib/timer-context'
import { ToastProvider } from '@/lib/toast-context'
import { UIProvider } from '@/lib/ui-context'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile && !profile.onboarding) {
    redirect('/onboarding')
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, nome, etapas')
    .eq('user_id', user.id)
    .eq('status', 'andamento')
    .order('nome')

  return (
    <ToastProvider>
      <TimerProvider userId={user.id}>
        <UIProvider>
          {/* Skip link for keyboard users */}
          <a href="#main-content" className="skip-link">Pular para o conteúdo</a>

          <div style={{ display: 'flex', minHeight: '100dvh' }}>
            <Sidebar profile={profile} />
            {/* Content area — marginLeft is reset on mobile via CSS */}
            <div id="dashboard-root" style={{ marginLeft: 'var(--sw)', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <MobileTopbar profile={profile} />
              <main id="main-content" style={{ flex: 1, overflowY: 'auto' }} tabIndex={-1}>
                {children}
              </main>
            </div>
          </div>

          {/* Mobile bottom navigation */}
          <BottomNav />

          <GlobalTimer />
          <QuickTaskModal userId={user.id} projects={projects || []} />
        </UIProvider>
      </TimerProvider>
    </ToastProvider>
  )
}
