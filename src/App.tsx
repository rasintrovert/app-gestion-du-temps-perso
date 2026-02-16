import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { KanbanBoard } from './components/KanbanBoard'
import { StudySession } from './components/StudySession'
import { ProductivityStats } from './components/ProductivityStats'
import { WeeklyReview } from './components/WeeklyReview'
import { Deadlines } from './components/Deadlines'
import { WeeklyPlanner } from './components/WeeklyPlanner'
import { SessionSetup } from './components/SessionSetup'
import { GoogleCalendar } from './components/GoogleCalendar'
import { Button } from './components/ui/button'
import { Toaster } from './components/ui/sonner'
import {
  LayoutDashboard,
  ListChecks,
  Clock,
  BarChart3,
  FileText,
  BookOpen,
  Menu,
  X,
  Settings,
  CalendarDays,
} from 'lucide-react'
import { apiBaseUrl, publicAnonKey } from './lib/api'

type View =
  | 'dashboard'
  | 'planner'
  | 'calendar'
  | 'kanban'
  | 'session'
  | 'stats'
  | 'review'
  | 'deadlines'
  | 'settings'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navigation: { name: string; view: View; icon: typeof LayoutDashboard }[] = [
    { name: 'Tableau de bord', view: 'dashboard', icon: LayoutDashboard },
    { name: 'Calendrier', view: 'calendar', icon: CalendarDays },
    { name: 'Kanban', view: 'kanban', icon: ListChecks },
    { name: "Session d'étude", view: 'session', icon: Clock },
    { name: 'Devoirs', view: 'deadlines', icon: BookOpen },
    { name: 'Statistiques', view: 'stats', icon: BarChart3 },
    { name: 'Revue', view: 'review', icon: FileText },
    { name: 'Configuration', view: 'settings', icon: Settings },
  ]

  const props = { apiBaseUrl, publicAnonKey }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard {...props} onNavigate={(view) => setCurrentView(view as View)} />
      case 'calendar':
        return <GoogleCalendar {...props} />
      case 'planner':
        return <WeeklyPlanner {...props} />
      case 'kanban':
        return <KanbanBoard {...props} />
      case 'session':
        return <StudySession {...props} />
      case 'stats':
        return <ProductivityStats {...props} />
      case 'review':
        return <WeeklyReview {...props} />
      case 'deadlines':
        return <Deadlines {...props} />
      case 'settings':
        return <SessionSetup {...props} />
      default:
        return <Dashboard {...props} onNavigate={(view) => setCurrentView(view as View)} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-right" />

      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <h1 className="text-xl font-bold text-gray-800">StudyFlow</h1>
        <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div className="flex pt-14 lg:pt-0">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out lg:static ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="hidden items-center gap-3 border-b border-gray-200 p-6 lg:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-xl font-bold text-white">
                S
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">StudyFlow</h1>
                <p className="text-xs text-gray-500">Productivité étudiante</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.view
                return (
                  <Button
                    key={item.view}
                    onClick={() => {
                      setCurrentView(item.view)
                      if (window.innerWidth < 1024) setSidebarOpen(false)
                    }}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`w-full justify-start ${
                      isActive ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                )
              })}
            </nav>

            <div className="border-t border-gray-200 p-4">
              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-700">💡 Astuce du jour</p>
                <p className="text-xs text-gray-600">
                  Commence par la tâche la plus difficile chaque matin
                </p>
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{renderView()}</div>
        </main>
      </div>
    </div>
  )
}
