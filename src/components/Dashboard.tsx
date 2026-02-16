import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { DailyReminders } from './DailyReminders'
import { Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, TrendingUp } from 'lucide-react'
import { Progress } from './ui/progress'

interface Task {
  id: string
  title: string
  priority: string
  deadline: string | null
  status: string
  course: string
}

interface Stats {
  totalHoursThisWeek: number
  completedTasks: number
  totalTasks: number
  completionRate: number
}

interface Suggestion {
  type: string
  message: string
  priority: string
}

interface DashboardProps {
  onNavigate: (view: string) => void
  apiBaseUrl: string
  publicAnonKey: string
}

export function Dashboard({ onNavigate, apiBaseUrl, publicAnonKey }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    fetchData()
  }, [apiBaseUrl, publicAnonKey])

  const fetchData = async () => {
    if (!apiBaseUrl) {
      setLoading(false)
      return
    }
    try {
      const headers = {
        Authorization: `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      }

      const sessionRes = await fetch(`${apiBaseUrl}/session/current`, { headers })
      const sessionData = await sessionRes.json()
      setHasSession(sessionData.success && sessionData.session !== null)

      const tasksRes = await fetch(`${apiBaseUrl}/tasks`, { headers })
      const tasksData = await tasksRes.json()

      const statsRes = await fetch(`${apiBaseUrl}/stats`, { headers })
      const statsData = await statsRes.json()

      const suggestionsRes = await fetch(`${apiBaseUrl}/ai-suggestions`, { headers })
      const suggestionsData = await suggestionsRes.json()

      if (tasksData.success) {
        const allTasks = tasksData.tasks || []
        const urgentTasks = allTasks
          .filter((t: Task) => t.status !== 'Terminé')
          .sort((a: Task, b: Task) => {
            const priorityOrder: Record<string, number> = { Élevé: 3, Moyen: 2, Faible: 1 }
            return (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0)
          })
          .slice(0, 5)
        setTasks(urgentTasks)
      }

      if (statsData.success) setStats(statsData.stats)
      if (suggestionsData.success) setSuggestions(suggestionsData.suggestions || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Élevé':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'Moyen':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'Faible':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'priority':
        return <TrendingUp className="h-5 w-5 text-yellow-500" />
      case 'encouragement':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      default:
        return <Sparkles className="h-5 w-5 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
        <p className="mt-1 text-gray-500">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <DailyReminders onViewPlanner={() => onNavigate('calendar')} />

      {!hasSession && (
        <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">👋</div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-bold text-purple-900">Bienvenue sur StudyFlow!</h3>
                <p className="mb-3 text-gray-700">
                  Pour commencer, configure ta session académique actuelle et ajoute tes cours avec leurs horaires.
                </p>
                <Button onClick={() => onNavigate('settings')} className="bg-purple-600 hover:bg-purple-700">
                  Configurer ma session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Sparkles className="h-5 w-5" />
              Assistant AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 rounded-lg bg-white/60 p-3">
                {getSuggestionIcon(suggestion.type)}
                <p className="flex-1 text-sm text-gray-700">{suggestion.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Heures d'étude</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.totalHoursThisWeek ?? 0}h</p>
                <p className="mt-1 text-xs text-gray-500">Cette semaine</p>
              </div>
              <Clock className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tâches complétées</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.completedTasks ?? 0}/{stats?.totalTasks ?? 0}
                </p>
                <Progress value={stats?.completionRate ?? 0} className="mt-2 h-2" />
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Taux de complétion</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.completionRate ?? 0}%</p>
                <p className="mt-1 text-xs text-gray-500">Performance globale</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tâches prioritaires</span>
            <Button variant="outline" size="sm" onClick={() => onNavigate('kanban')}>
              Voir tout
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-gray-300" />
              <p>Aucune tâche urgente. Bien joué!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{task.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500">{task.course}</span>
                      {task.deadline && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.deadline).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={getPriorityColor(task.priority)} variant="outline">
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Button
          className="h-20 text-lg text-white bg-blue-500 hover:bg-blue-600"
          onClick={() => onNavigate('calendar')}
        >
          <Calendar className="mr-2 h-6 w-6" />
          Voir mon calendrier
        </Button>
        <Button
          className="h-20 text-lg text-white bg-green-500 hover:bg-green-600"
          onClick={() => onNavigate('session')}
        >
          <Clock className="mr-2 h-6 w-6" />
          Démarrer une session
        </Button>
      </div>
    </div>
  )
}
