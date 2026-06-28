'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TaskCheckbox({ taskId, initialChecked }: { taskId: string; initialChecked: boolean }) {
  const [checked, setChecked] = useState(initialChecked)
  const supabase = createClient()

  async function toggle() {
    const newStatus = checked ? 'ag' : 'co'
    setChecked(c => !c)
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={toggle}
      style={{ cursor: 'pointer', accentColor: 'var(--p)', width: 16, height: 16 }}
    />
  )
}
