import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface PlanBlock {
  id?: string
  day: number
  startHour: number
  endHour: number
  label: string
  course?: string
}

interface WeeklyPlan {
  weekKey: string
  priorities: string[]
  blocks: PlanBlock[]
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)

function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function getWeekRange(weekKey: string): { start: Date; end: Date } {
  const [y, w] = weekKey.split('-W').map(Number)
  const start = new Date(y, 0, 1)
  const day = (w - 1) * 7 - (start.getDay() || 7) + 2
  start.setDate(day)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { start, end }
}

export function WeeklyPlanner({
  apiBaseUrl,
  publicAnonKey,
}: {
  apiBaseUrl: string
  publicAnonKey: string
}) {
  const [weekKey, setWeekKey] = useState(() => getWeekKey(new Date()))
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [editPriorities, setEditPriorities] = useState(false)
  const [newPriority, setNewPriority] = useState('')
  const [newBlock, setNewBlock] = useState<Partial<PlanBlock> | null>(null)

  useEffect(() => {
    if (!apiBaseUrl) {
      setLoading(false)
      return
    }
    const headers = { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }
    fetch(`${apiBaseUrl}/weekly-plan/${weekKey}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.plan) setPlan(data.plan)
        else setPlan({ weekKey, priorities: [], blocks: [] })
      })
      .catch(() => setPlan({ weekKey, priorities: [], blocks: [] }))
      .finally(() => setLoading(false))
  }, [apiBaseUrl, publicAnonKey, weekKey])

  const savePlan = async (payload: WeeklyPlan) => {
    try {
      const res = await fetch(`${apiBaseUrl}/weekly-plan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setPlan(payload)
        toast.success('Planning enregistré')
      }
    } catch {
      toast.error('Erreur enregistrement')
    }
  }

  const addPriority = () => {
    const p = newPriority.trim()
    if (!p) return
    const priorities = [...(plan?.priorities ?? []), p].slice(0, 3)
    const payload = { weekKey, priorities, blocks: plan?.blocks ?? [] }
    setPlan(payload)
    setNewPriority('')
    setEditPriorities(false)
    savePlan(payload)
  }

  const removePriority = (index: number) => {
    const priorities = (plan?.priorities ?? []).filter((_, i) => i !== index)
    const payload = { weekKey, priorities, blocks: plan?.blocks ?? [] }
    setPlan(payload)
    savePlan(payload)
  }

  const addBlock = () => {
    if (!newBlock || newBlock.day == null || newBlock.startHour == null || newBlock.endHour == null || !newBlock.label) {
      toast.error('Remplis jour, créneau et libellé')
      return
    }
    const blocks = [...(plan?.blocks ?? []), { ...newBlock, id: `b-${Date.now()}` } as PlanBlock]
    const payload = { weekKey, priorities: plan?.priorities ?? [], blocks }
    setPlan(payload)
    setNewBlock(null)
    savePlan(payload)
  }

  const removeBlock = (index: number) => {
    const blocks = (plan?.blocks ?? []).filter((_, i) => i !== index)
    const payload = { weekKey, priorities: plan?.priorities ?? [], blocks }
    setPlan(payload)
    savePlan(payload)
  }

  const { start, end } = getWeekRange(weekKey)
  const prevWeek = () => setWeekKey(getWeekKey(new Date(start.getTime() - 1)))
  const nextWeek = () => setWeekKey(getWeekKey(new Date(end.getTime() + 1)))

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  const blocks = plan?.blocks ?? []
  const priorities = plan?.priorities ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Planificateur hebdomadaire</h1>
          <p className="mt-1 text-gray-500">Top 3 priorités et grille de la semaine</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[180px] text-center font-medium">
            {start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – {end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 3 priorités</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {priorities.map((p, i) => (
            <div key={i} className="flex items-center justify-between rounded border bg-gray-50 px-3 py-2">
              <span className="font-medium">{p}</span>
              <Button variant="ghost" size="sm" onClick={() => removePriority(i)}>
                <Trash2 className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          ))}
          {editPriorities ? (
            <div className="flex gap-2">
              <Input
                placeholder="Nouvelle priorité"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPriority()}
              />
              <Button onClick={addPriority} disabled={priorities.length >= 3 || !newPriority.trim()}>
                Ajouter
              </Button>
              <Button variant="outline" onClick={() => setEditPriorities(false)}>Annuler</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditPriorities(true)} disabled={priorities.length >= 3}>
              <Plus className="mr-1 h-4 w-4" /> Ajouter une priorité
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Grille de la semaine</CardTitle>
          {!newBlock ? (
            <Button size="sm" onClick={() => setNewBlock({ day: 0, startHour: 9, endHour: 10, label: '' })}>
              <Plus className="mr-1 h-4 w-4" /> Bloc
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {newBlock ? (
            <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-gray-50 p-3">
              <div>
                <Label>Jour</Label>
                <select
                  className="ml-1 rounded border px-2 py-1"
                  value={newBlock.day}
                  onChange={(e) => setNewBlock({ ...newBlock, day: Number(e.target.value) })}
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Début (h)</Label>
                <Input
                  type="number"
                  min={8}
                  max={22}
                  className="w-16"
                  value={newBlock.startHour ?? 9}
                  onChange={(e) => setNewBlock({ ...newBlock, startHour: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Fin (h)</Label>
                <Input
                  type="number"
                  min={8}
                  max={22}
                  className="w-16"
                  value={newBlock.endHour ?? 10}
                  onChange={(e) => setNewBlock({ ...newBlock, endHour: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Libellé</Label>
                <Input
                  placeholder="Ex: Révision maths"
                  value={newBlock.label ?? ''}
                  onChange={(e) => setNewBlock({ ...newBlock, label: e.target.value })}
                />
              </div>
              <Button onClick={addBlock}>Enregistrer</Button>
              <Button variant="outline" onClick={() => setNewBlock(null)}>Annuler</Button>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <div className="grid min-w-[600px]" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
              <div className="border-b border-r p-2 text-sm font-medium text-gray-500">Heure</div>
              {DAYS.map((d, i) => (
                <div key={i} className="border-b border-r p-2 text-center text-sm font-medium">{d}</div>
              ))}
              {HOURS.map((hour) => (
                <div key={`row-${hour}`} className="contents">
                  <div className="border-r p-1 text-xs text-gray-500">{hour}h</div>
                  {DAYS.map((_, dayIndex) => (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className="relative min-h-[32px] border-b border-r p-1"
                    >
                      {blocks
                        .filter((b) => b.day === dayIndex && b.startHour <= hour && b.endHour > hour)
                        .map((b) => (
                          <div
                            key={`${b.id ?? blocks.indexOf(b)}-${hour}`}
                            className="absolute inset-1 flex items-center justify-between rounded bg-blue-100 px-2 text-xs"
                          >
                            <span className="truncate font-medium">{b.label}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => removeBlock(blocks.indexOf(b))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
