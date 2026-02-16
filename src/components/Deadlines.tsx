import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Calendar, Trash2, BookOpen } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  course: string
  type: string
  priority: string
  status: string
  deadline: string | null
}

interface DeadlinesProps {
  apiBaseUrl: string
  publicAnonKey: string
}

export function Deadlines({ apiBaseUrl, publicAnonKey }: DeadlinesProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCourse, setFilterCourse] = useState<string>('all')

  useEffect(() => {
    if (apiBaseUrl) fetchTasks()
  }, [apiBaseUrl, publicAnonKey])

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/tasks`, { headers: { Authorization: `Bearer ${publicAnonKey}` } })
      const data = await res.json()
      if (data.success) {
        const withDeadlines = (data.tasks || []).filter((t: Task) => t.deadline)
        withDeadlines.sort((a: Task, b: Task) =>
          !a.deadline || !b.deadline ? 0 : new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        )
        setTasks(withDeadlines)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyLevel = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0 || days <= 3) return 'urgent'
    if (days <= 7) return 'soon'
    return 'normal'
  }

  const getPriorityColor = (p: string) =>
    p === 'Élevé' ? 'bg-red-100 text-red-700' : p === 'Moyen' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'

  const getTypeIcon = (t: string) => ({ Quiz: '📝', Projet: '📂', Devoir: '📄', Lecture: '📖' }[t] || '📌')

  const getDaysUntil = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return `En retard de ${Math.abs(days)} jour(s)`
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Demain'
    return `Dans ${days} jours`
  }

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } })
      const data = await res.json()
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t.id !== id))
        toast.success('Tâche supprimée')
      }
    } catch (e) {
      toast.error('Erreur suppression')
    }
  }

  const filtered = tasks.filter((t) => filterCourse === 'all' || t.course === filterCourse)
  const courses = Array.from(new Set(tasks.map((t) => t.course).filter(Boolean)))
  const urgent = filtered.filter((t) => t.deadline && getUrgencyLevel(t.deadline) === 'urgent')
  const soon = filtered.filter((t) => t.deadline && getUrgencyLevel(t.deadline) === 'soon')
  const normal = filtered.filter((t) => t.deadline && getUrgencyLevel(t.deadline) === 'normal')

  const TaskRow = ({ task }: { task: Task }) => (
    <div className="flex items-start justify-between rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">{getTypeIcon(task.type)}</span>
          <h4 className="font-semibold text-gray-800">{task.title}</h4>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{task.course}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{task.deadline && new Date(task.deadline).toLocaleDateString('fr-FR')}</span>
          <span>•</span>
          <span className="font-medium">{task.deadline && getDaysUntil(task.deadline)}</span>
        </div>
        <div className="mt-2 flex gap-2">
          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
          <Badge variant="outline">{task.type}</Badge>
          <Badge variant="outline" className={task.status === 'Terminé' ? 'bg-green-100' : ''}>{task.status}</Badge>
        </div>
      </div>
      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-500" onClick={() => deleteTask(task.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Devoirs & Deadlines</h1>
          <p className="mt-1 text-gray-500">Garde un œil sur tes échéances</p>
        </div>
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les cours</SelectItem>
            {courses.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Urgents</p>
                <p className="text-3xl font-bold text-red-700">{urgent.length}</p>
              </div>
              <span className="text-4xl">🚨</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Cette semaine</p>
                <p className="text-3xl font-bold text-yellow-700">{soon.length}</p>
              </div>
              <span className="text-4xl">⏰</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Plus tard</p>
                <p className="text-3xl font-bold text-green-700">{normal.length}</p>
              </div>
              <span className="text-4xl">✅</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {urgent.length > 0 && (
        <Card className="border-2 border-red-300">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-900">🚨 Tâches urgentes</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">{urgent.map((task) => <TaskRow key={task.id} task={task} />)}</div>
          </CardContent>
        </Card>
      )}
      {soon.length > 0 && (
        <Card className="border-2 border-yellow-300">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-yellow-900">⏰ Cette semaine</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">{soon.map((task) => <TaskRow key={task.id} task={task} />)}</div>
          </CardContent>
        </Card>
      )}
      {normal.length > 0 && (
        <Card className="border-2 border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-900">✅ À venir</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">{normal.map((task) => <TaskRow key={task.id} task={task} />)}</div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-lg font-medium">Aucune deadline à venir</p>
              <p className="mt-1 text-sm">Ajoute des tâches avec des dates dans le Kanban</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
