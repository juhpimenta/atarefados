'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import type { Task } from './types'

type ModalMode = 'create' | 'timer'

type UICtx = {
  modalOpen: boolean
  modalMode: ModalMode
  onCreated: ((task: Task) => void) | null
  openModal: (mode?: ModalMode, onCreated?: (task: Task) => void) => void
  closeModal: () => void
}

const Ctx = createContext<UICtx | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [onCreated, setOnCreated] = useState<((task: Task) => void) | null>(null)

  const openModal = useCallback((mode: ModalMode = 'create', cb?: (task: Task) => void) => {
    setModalMode(mode)
    setOnCreated(cb ? () => cb : null)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setOnCreated(null)
  }, [])

  return (
    <Ctx.Provider value={{ modalOpen, modalMode, onCreated, openModal, closeModal }}>
      {children}
    </Ctx.Provider>
  )
}

export function useUI() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useUI must be inside UIProvider')
  return ctx
}
