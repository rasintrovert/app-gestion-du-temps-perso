import { useEffect, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, Calendar, Clock, Trash2, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  description: string
  course: string
  type: string
  priority: string
  status: string
  deadline: string | null
  duration: number
  studyMethod: string
}

interface KanbanBoardProps {
  apiBaseUrl: string
  publicAnonKey: string
}

function TaskCard({
  task,
  onDelete,
}: {
  task: Task
  onDelete: (id: string) => void
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }))

  const getPriorityColor = (p: string) => {
    switch (p) {
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
  const getTypeColor = (t: string) => {
    switch (t) {
      case 'Devoir':
        return 'bg-blue-100 text-blue-700'
      case 'Quiz':
        return 'bg-purple-100 text-purple-700'
      case 'Projet':
        return 'bg-orange-100 text-orange-700'
      case 'Lecture':
        return 'bg-teal-100 text-teal-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div
      ref={drag}
      className={`cursor-move rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="mb-2 flex items-start justify-between">
        <h4 className="flex-1 font-semibold text-gray-800">{task.title}</h4>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500" onClick={() => onDelete(task.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {task.description && <p className="mb-3 text-sm text-gray-600">{task.description}</p>}
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge className={getPriorityColor(task.priority)} variant="outline">
          {task.priority}
        </Badge>
        <Badge className={getTypeColor(task.type)}>{task.type}</Badge>
      </div>
      <div className="space-y-1 text-xs text-gray-500">
        {task.course && <p>📚 {task.course}</p>}
        {task.deadline && (
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(task.deadline).toLocaleDateString('fr-FR')}
          </p>
        )}
        {task.duration > 0 && (
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.duration} min
          </p>
        )}
      </div>
    </div>
  )
}

function Column({
  status,
  tasks,
  onDrop,
  onDelete,
}: {
  status: string
  tasks: Task[]
  onDrop: (taskId: string, newStatus: string) => void
  onDelete: (id: string) => void
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'task',
    drop: (item: { id: string; status: string }) => {
      if (item.status !== status) onDrop(item.id, status)
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }))

  const colColor =
    status === 'À faire'
      ? 'border-blue-300 bg-blue-50'
      : status === 'En cours'
        ? 'border-yellow-300 bg-yellow-50'
        : 'border-green-300 bg-green-50'

  return (
    <div
      ref={drop}
      className={`min-h-[200px] min-w-[300px] flex-1 rounded-lg border-2 p-4 transition-colors ${colColor} ${isOver ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-800">{status}</h3>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-600">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

export function KanbanBoard({ apiBaseUrl, publicAnonKey }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterCourse, setFilterCourse] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    course: '',
    type: 'Devoir',
    priority: 'Moyen',
    deadline: '',
    duration: 60,
    studyMethod: 'Pomodoro',
  })

  useEffect(() => {
    if (apiBaseUrl) fetchTasks()
  }, [apiBaseUrl, publicAnonKey])

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/tasks`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      })
      const data = await res.json()
      if (data.success) setTasks(data.tasks || [])
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors du chargement des tâches')
    } finally {
      setLoading(false)
    }
  }

  const createTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Le titre est requis')
      return
    }
    try {
      const res = await fetch(`${apiBaseUrl}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      })
      const data = await res.json()
      if (data.success) {
        setTasks((prev) => [...prev, data.task])
        setIsDialogOpen(false)
        setNewTask({
          title: '',
          description: '',
          course: '',
          type: 'Devoir',
          priority: 'Moyen',
          deadline: '',
          duration: 60,
          studyMethod: 'Pomodoro',
        })
        toast.success('Tâche créée avec succès')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la création')
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)))
        toast.success('Tâche mise à jour')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      })
      const data = await res.json()
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
        toast.success('Tâche supprimée')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la suppression')
    }
  }

  const filtered = tasks.filter((t) => {
    if (filterCourse !== 'all' && t.course !== filterCourse) return false
    if (filterType !== 'all' && t.type !== filterType) return false
    return true
  })
  const courses = Array.from(new Set(tasks.map((t) => t.course).filter(Boolean)))

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Kanban</h1>
            <p className="mt-1 text-gray-500">Glissez-déposez vos tâches</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle tâche</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Ex: Finir le projet de mathématiques"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Détails..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course">Cours</Label>
                    <Input
                      id="course"
                      value={newTask.course}
                      onChange={(e) => setNewTask({ ...newTask, course: e.target.value })}
                      placeholder="Ex: Mathématiques"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={newTask.type} onValueChange={(v) => setNewTask({ ...newTask, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Devoir">Devoir</SelectItem>
                        <SelectItem value="Quiz">Quiz</SelectItem>
                        <SelectItem value="Projet">Projet</SelectItem>
                        <SelectItem value="Lecture">Lecture</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priorité</Label>
                    <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Élevé">Élevé</SelectItem>
                        <SelectItem value="Moyen">Moyen</SelectItem>
                        <SelectItem value="Faible">Faible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Durée (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newTask.duration}
                      onChange={(e) => setNewTask({ ...newTask, duration: parseInt(e.target.value, 10) || 60 })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="deadline">Date limite</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Méthode d'étude</Label>
                  <Select value={newTask.studyMethod} onValueChange={(v) => setNewTask({ ...newTask, studyMethod: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pomodoro">Pomodoro</SelectItem>
                      <SelectItem value="Deep Work">Deep Work</SelectItem>
                      <SelectItem value="Révision espacée">Révision espacée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createTask} className="w-full bg-blue-500 hover:bg-blue-600">
                  Créer la tâche
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <div className="flex items-center gap-2">
                <Label>Cours:</Label>
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label>Type:</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Devoir">Devoir</SelectItem>
                    <SelectItem value="Quiz">Quiz</SelectItem>
                    <SelectItem value="Projet">Projet</SelectItem>
                    <SelectItem value="Lecture">Lecture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 overflow-x-auto pb-4">
          <Column
            status="À faire"
            tasks={filtered.filter((t) => t.status === 'À faire')}
            onDrop={updateTaskStatus}
            onDelete={deleteTask}
          />
          <Column
            status="En cours"
            tasks={filtered.filter((t) => t.status === 'En cours')}
            onDrop={updateTaskStatus}
            onDelete={deleteTask}
          />
          <Column
            status="Terminé"
            tasks={filtered.filter((t) => t.status === 'Terminé')}
            onDrop={updateTaskStatus}
            onDelete={deleteTask}
          />
        </div>
      </div>
    </DndProvider>
  )
}
