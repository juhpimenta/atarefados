import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Sidebar from '@/components/layout/Sidebar'
import MobileTopbar from '@/components/layout/MobileTopbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Se não completou onboarding, redirecionar
  if (profile && !profile.onboarding) {
    redirect('/onboarding')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar profile={profile} />
      <div id="mobOv" className="mob-overlay" />
      <div style={{ marginLeft: 'var(--sw)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <MobileTopbar profile={profile} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
