import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ChevronLeft, ChevronRight, Plus, CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'

interface Course {
  id: string
  code: string
  name: string
  color?: string
}

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  courseId?: string
  course?: string
  description?: string
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)

function getWeekStart(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

export function GoogleCalendar({
  apiBaseUrl,
  publicAnonKey,
}: {
  apiBaseUrl: string
  publicAnonKey: string
}) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [_slot, setSlot] = useState<{ day: number; hour: number } | null>(null)
  const [form, setForm] = useState({ title: '', start: '', end: '', courseId: '', description: '' })

  const headers = { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    if (!apiBaseUrl) {
      setLoading(false)
      return
    }
    Promise.all([
      fetch(`${apiBaseUrl}/courses`, { headers }).then((r) => r.json()),
      fetch(`${apiBaseUrl}/calendar-events`, { headers }).then((r) => r.json()),
    ])
      .then(([coursesRes, eventsRes]) => {
        if (coursesRes.success && coursesRes.courses) setCourses(coursesRes.courses)
        if (eventsRes.success && eventsRes.events) setEvents(eventsRes.events)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBaseUrl, publicAnonKey])

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const eventsInWeek = events.filter((e) => {
    const start = new Date(e.start)
    return start >= weekStart && start <= new Date(weekEnd.getTime() + 86400000)
  })

  const markPlanningViewed = () => {
    try {
      localStorage.setItem('lastPlannerView', new Date().toISOString())
    } catch {}
  }

  const openCreate = (dayIndex: number, hour: number) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + dayIndex)
    d.setHours(hour, 0, 0, 0)
    const end = new Date(d)
    end.setHours(hour + 1, 0, 0, 0)
    setForm({
      title: '',
      start: d.toISOString().slice(0, 16),
      end: end.toISOString().slice(0, 16),
      courseId: '',
      description: '',
    })
    setEditingEvent(null)
    setSlot({ day: dayIndex, hour })
    setDialogOpen(true)
  }

  const openEdit = (event: CalendarEvent) => {
    setForm({
      title: event.title,
      start: event.start.slice(0, 16),
      end: event.end.slice(0, 16),
      courseId: event.courseId ?? '',
      description: event.description ?? '',
    })
    setEditingEvent(event)
    setSlot(null)
    setDialogOpen(true)
  }

  const saveEvent = async () => {
    if (!form.title.trim()) {
      toast.error('Titre requis')
      return
    }
    const payload = {
      title: form.title,
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString(),
      courseId: form.courseId || undefined,
      description: form.description || undefined,
    }
    try {
      if (editingEvent) {
        const res = await fetch(`${apiBaseUrl}/calendar-event/${editingEvent.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.success && data.event) {
          setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? data.event : e)))
          toast.success('Événement mis à jour')
        }
      } else {
        const res = await fetch(`${apiBaseUrl}/calendar-event`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.success && data.event) {
          setEvents((prev) => [...prev, data.event])
          toast.success('Événement créé')
        }
      }
      setDialogOpen(false)
    } catch {
      toast.error('Erreur enregistrement')
    }
  }

  const deleteEvent = async () => {
    if (!editingEvent) return
    try {
      const res = await fetch(`${apiBaseUrl}/calendar-event/${editingEvent.id}`, {
        method: 'DELETE',
        headers,
      })
      const data = await res.json()
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== editingEvent.id))
        toast.success('Événement supprimé')
        setDialogOpen(false)
      }
    } catch {
      toast.error('Erreur suppression')
    }
  }

  const getEventsForCell = (dayIndex: number, hour: number) => {
    const dayStart = new Date(weekStart)
    dayStart.setDate(dayStart.getDate() + dayIndex)
    dayStart.setHours(hour, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(hour + 1, 0, 0, 0)
    return eventsInWeek.filter((e) => {
      const start = new Date(e.start)
      const end = new Date(e.end)
      return start < dayEnd && end > dayStart
    })
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Calendrier</h1>
          <p className="mt-1 text-gray-500">Vue semaine – cours et événements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(getWeekStart(new Date(weekStart.getTime() - 86400000 * 7)))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[200px] text-center font-medium">
            {weekStart.toLocaleDateString('fr-FR', { month: 'long' })} {weekStart.getFullYear()}
          </span>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(getWeekStart(new Date(weekStart.getTime() + 86400000 * 7)))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={markPlanningViewed}>
            <CalendarCheck className="mr-1 h-4 w-4" /> Planning consulté
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid overflow-x-auto" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
            <div className="border-b border-r p-2 text-sm font-medium text-gray-500">Heure</div>
            {weekDates.map((d, i) => (
              <div key={i} className="border-b border-r p-2 text-center text-sm font-medium">
                <div>{DAY_LABELS[i]}</div>
                <div className="text-xs text-gray-500">{d.getDate()}</div>
              </div>
            ))}
            {HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="border-r p-1 text-xs text-gray-500">{hour}h</div>
                {weekDates.map((_, dayIndex) => {
                  const cellEvents = getEventsForCell(dayIndex, hour)
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className="relative min-h-[44px] border-b border-r p-1"
                      onClick={() => {
                        if (cellEvents.length === 0) openCreate(dayIndex, hour)
                      }}
                    >
                      {cellEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          className="absolute inset-1 w-full rounded bg-blue-100 text-left px-2 text-xs font-medium hover:bg-blue-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(ev)
                          }}
                        >
                          {ev.title}
                        </button>
                      ))}
                      {cellEvents.length === 0 && (
                        <div className="flex h-full items-center justify-center text-gray-300 hover:bg-gray-50">
                          <Plus className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Modifier l’événement' : 'Nouvel événement'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: TD Maths"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Début</Label>
                <Input
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                />
              </div>
              <div>
                <Label>Fin</Label>
                <Input
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Cours</Label>
              <Select value={form.courseId} onValueChange={(v) => setForm((f) => ({ ...f, courseId: v }))}>
                <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} – {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description (optionnel)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            {editingEvent && (
              <Button variant="destructive" onClick={deleteEvent}>
                Supprimer
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={saveEvent}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
