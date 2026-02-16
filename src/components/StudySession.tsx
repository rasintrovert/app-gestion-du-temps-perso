import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Play, Pause, RotateCcw, CheckCircle, HandHeart, Sparkles } from 'lucide-react'
import { Progress } from './ui/progress'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  course: string
  studyMethod: string
  duration: number
  status?: string
}

interface StudySessionProps {
  apiBaseUrl: string
  publicAnonKey: string
}

export function StudySession({ apiBaseUrl, publicAnonKey }: StudySessionProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [method, setMethod] = useState<string>('Pomodoro')
  const [customDuration, setCustomDuration] = useState<number>(25)
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const [showPreSessionRitual, setShowPreSessionRitual] = useState(false)
  const [showEndRitual, setShowEndRitual] = useState(false)
  const [hasPrayed, setHasPrayed] = useState(false)
  const [hasThanked, setHasThanked] = useState(false)

  useEffect(() => {
    if (apiBaseUrl) fetchTasks()
  }, [apiBaseUrl, publicAnonKey])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/tasks`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      })
      const data = await res.json()
      if (data.success) {
        const incomplete = (data.tasks || []).filter((t: Task) => t.status !== 'Terminé')
        setTasks(incomplete)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getMethodDuration = (m: string): number => {
    switch (m) {
      case 'Pomodoro':
        return 25
      case 'Deep Work':
        return 90
      case 'Révision espacée':
        return 45
      default:
        return customDuration
    }
  }

  const startSession = () => {
    const today = new Date().toDateString()
    const lastPlannerView = localStorage.getItem('lastPlannerView')
    if (lastPlannerView !== today) {
      toast.error("⚠️ Tu dois d'abord consulter ton planning aujourd'hui!", { duration: 5000 })
      return
    }
    setShowPreSessionRitual(true)
  }

  const proceedWithSession = async () => {
    if (!hasPrayed) {
      toast.error('🙏 La prière au début est obligatoire pour débloquer ta session')
      return
    }
    setShowPreSessionRitual(false)
    setHasPrayed(false)

    const task = tasks.find((t) => t.id === selectedTask)
    const duration = method === 'Personnalisé' ? customDuration : getMethodDuration(method)

    try {
      const res = await fetch(`${apiBaseUrl}/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: selectedTask || null,
          course: task?.course ?? '',
          method,
          duration,
          startTime: new Date().toISOString(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSessionId(data.session.id)
        setTotalTime(duration * 60)
        setTimeLeft(duration * 60)
        setIsRunning(true)
        toast.success('Session démarrée!')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors du démarrage de la session')
    }
  }

  const handleSessionComplete = () => {
    setIsRunning(false)
    setShowEndRitual(true)
  }

  const completeSessionWithThanks = async () => {
    if (!hasThanked) {
      toast.error("🙏 N'oublie pas de remercier Dieu pour cette session!")
      return
    }
    if (sessionId) {
      try {
        await fetch(`${apiBaseUrl}/sessions/${sessionId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completed: true,
            endTime: new Date().toISOString(),
          }),
        })
        toast.success('🎉 Session terminée! Excellent travail!')
        setShowEndRitual(false)
        setHasThanked(false)
        resetSession()
      } catch (e) {
        console.error(e)
      }
    }
  }

  const pauseSession = () => setIsRunning(false)
  const resumeSession = () => setIsRunning(true)

  const resetSession = () => {
    setIsRunning(false)
    setTimeLeft(0)
    setTotalTime(0)
    setSessionId(null)
  }

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const progressPercentage = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0
  const selectedTaskData = tasks.find((t) => t.id === selectedTask)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">Session d'étude</h1>
        <p className="mt-1 text-gray-500">Concentre-toi et atteins tes objectifs</p>
      </div>

      {!isRunning && timeLeft === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configurer votre session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="task">Tâche (optionnel)</Label>
              <Select value={selectedTask || 'none'} onValueChange={(v) => setSelectedTask(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une tâche..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune tâche spécifique</SelectItem>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title} {t.course ? `(${t.course})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="method">Méthode d'étude</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pomodoro">🍅 Pomodoro (25 min)</SelectItem>
                  <SelectItem value="Deep Work">🧠 Deep Work (90 min)</SelectItem>
                  <SelectItem value="Révision espacée">📚 Révision espacée (45 min)</SelectItem>
                  <SelectItem value="Personnalisé">⚙️ Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {method === 'Personnalisé' && (
              <div>
                <Label htmlFor="duration">Durée (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={180}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseInt(e.target.value, 10) || 25)}
                />
              </div>
            )}
            <Button onClick={startSession} className="h-14 w-full bg-green-500 text-lg hover:bg-green-600">
              <Play className="mr-2 h-6 w-6" />
              Démarrer la session
            </Button>
          </CardContent>
        </Card>
      )}

      {(isRunning || timeLeft > 0) && (
        <Card className="border-2 border-blue-300">
          <CardContent className="pt-8">
            {selectedTaskData && (
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-500">Tâche en cours</p>
                <h3 className="text-xl font-bold text-gray-800">{selectedTaskData.title}</h3>
                {selectedTaskData.course && <p className="mt-1 text-sm text-gray-600">{selectedTaskData.course}</p>}
              </div>
            )}
            <div className="mb-6 text-center">
              <div className="mb-4 inline-flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                <div className="text-6xl font-bold text-blue-600">{formatTime(timeLeft)}</div>
              </div>
              <Progress value={progressPercentage} className="mb-2 h-3" />
              <p className="text-sm text-gray-500">
                {method} • {Math.round(progressPercentage)}% complété
              </p>
            </div>
            <div className="flex justify-center gap-3">
              {isRunning ? (
                <Button onClick={pauseSession} variant="outline" size="lg">
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </Button>
              ) : (
                <Button onClick={resumeSession} className="bg-green-500 hover:bg-green-600" size="lg">
                  <Play className="mr-2 h-5 w-5" />
                  Reprendre
                </Button>
              )}
              <Button onClick={resetSession} variant="outline" size="lg">
                <RotateCcw className="mr-2 h-5 w-5" />
                Réinitialiser
              </Button>
              {timeLeft === 0 && (
                <Button onClick={handleSessionComplete} className="bg-blue-500 hover:bg-blue-600" size="lg">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Terminer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-lg">💡 À propos des méthodes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-blue-900">🍅 Pomodoro (25 min)</h4>
            <p className="text-sm text-gray-700">
              Travaillez intensément 25 minutes, puis pause 5 minutes. Idéal pour les tâches courtes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900">🧠 Deep Work (90 min)</h4>
            <p className="text-sm text-gray-700">
              Session longue sans interruption. Parfait pour les projets complexes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900">📚 Révision espacée (45 min)</h4>
            <p className="text-sm text-gray-700">
              Session pour mémorisation et révision. Alternez révision et rappel actif.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPreSessionRitual} onOpenChange={setShowPreSessionRitual}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HandHeart className="h-6 w-6 text-purple-600" />
              Rituel de pré-session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
              <p className="text-sm leading-relaxed text-gray-700">
                Avant de commencer, prends un moment pour te centrer et demander la bénédiction de Dieu pour cette
                période de travail.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border-2 border-gray-200 bg-white p-3">
              <input type="checkbox" checked readOnly disabled className="mt-1 h-5 w-5 rounded border-gray-300 bg-gray-100 text-green-600" />
              <div className="flex-1">
                <Label className="cursor-pointer font-semibold text-gray-900">✅ Planning consulté</Label>
                <p className="mt-1 text-xs text-gray-600">Tu as déjà consulté ton planning aujourd'hui</p>
              </div>
            </div>
            <div
              className="rounded-lg border-2 bg-white p-3 transition-all"
              style={{ borderColor: hasPrayed ? '#10b981' : '#e5e7eb' }}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-gray-300 bg-gray-100 text-purple-600"
                  checked={hasPrayed}
                  onChange={() => setHasPrayed(!hasPrayed)}
                />
                <div className="flex-1">
                  <Label className="cursor-pointer font-semibold text-gray-900">🙏 Prière de démarrage (Obligatoire)</Label>
                  <p className="mt-1 text-xs text-gray-600">
                    "Seigneur, guide-moi dans cette session d'étude et aide-moi à rester concentré(e)"
                  </p>
                </div>
              </div>
            </div>
            {!hasPrayed && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">⚠️ La prière est obligatoire pour débloquer ta session</p>
              </div>
            )}
            <Button
              onClick={proceedWithSession}
              disabled={!hasPrayed}
              className="h-14 w-full bg-green-500 text-lg hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="mr-2 h-6 w-6" />
              Commencer la session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEndRitual} onOpenChange={setShowEndRitual}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-6 w-6 text-yellow-600" />
              Félicitations! Session terminée
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div className="rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-green-50 p-4 text-center">
              <div className="mb-2 text-4xl">🎉</div>
              <p className="mb-2 text-lg font-bold text-gray-900">Excellent travail!</p>
              <p className="text-sm leading-relaxed text-gray-700">
                Tu viens de terminer{' '}
                {method === 'Personnalisé'
                  ? `${customDuration} minutes`
                  : method === 'Pomodoro'
                    ? '25 minutes'
                    : method === 'Deep Work'
                      ? '90 minutes'
                      : '45 minutes'}{' '}
                de concentration. Prends un moment pour remercier Dieu.
              </p>
            </div>
            <div
              className="rounded-lg border-2 bg-white p-3 transition-all"
              style={{ borderColor: hasThanked ? '#10b981' : '#e5e7eb' }}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-gray-300 bg-gray-100 text-purple-600"
                  checked={hasThanked}
                  onChange={() => setHasThanked(!hasThanked)}
                />
                <div className="flex-1">
                  <Label className="cursor-pointer font-semibold text-gray-900">🙏 Remercier Dieu (Obligatoire)</Label>
                  <p className="mt-1 text-xs text-gray-600">
                    "Merci Seigneur pour la concentration et les connaissances acquises"
                  </p>
                </div>
              </div>
            </div>
            {!hasThanked && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">⚠️ N'oublie pas de remercier Dieu pour cette session!</p>
              </div>
            )}
            <Button
              onClick={completeSessionWithThanks}
              disabled={!hasThanked}
              className="h-14 w-full bg-blue-500 text-lg hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle className="mr-2 h-6 w-6" />
              Terminer la session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
