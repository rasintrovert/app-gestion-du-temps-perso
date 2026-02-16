import { useState } from 'react'
import Dashboard from './components/Dashboard'
import SessionGenerator from './components/SessionGenerator'

export type View = 'dashboard' | 'session'

export interface DashboardProps {
  onStartSession: () => void
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')

  return (
    <>
      {view === 'dashboard' && (
        <Dashboard onStartSession={() => setView('session')} />
      )}
      {view === 'session' && (
        <SessionGenerator onBack={() => setView('dashboard')} />
      )}
    </>
  )
}
