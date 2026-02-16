import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Plus, Edit2, Trash2, Save, GraduationCap, BookOpen, Calendar, Wifi, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getFetchErrorMessage } from '../lib/api'

interface AcademicSession {
  id: string
  name: string
  type: string
  year: number
  startDate: string
  endDate: string
  isCurrent: boolean
}

interface Course {
  id: string
  sessionId: string
  code: string
  name: string
  professor: string
  color: string
  credits: number
  schedule: Array<{ day: number; startTime: string; endTime: string; location: string }>
}

interface SessionSetupProps {
  apiBaseUrl: string
  publicAnonKey: string
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4',
  '#ef4444', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#f43f5e',
]

export function SessionSetup({ apiBaseUrl, publicAnonKey }: SessionSetupProps) {
  const [, setSessions] = useState<AcademicSession[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [currentSession, setCurrentSession] = useState<AcademicSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    id: '',
    name: '',
    type: 'Automne',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    isCurrent: false,
  })
  const [courseForm, setCourseForm] = useState({
    id: '',
    sessionId: '',
    code: '',
    name: '',
    professor: '',
    color: COLORS[0],
    credits: 3,
    schedule: [] as Array<{ day: number; startTime: string; endTime: string; location: string }>,
  })
  const [scheduleEntry, setScheduleEntry] = useState({
    day: 1,
    startTime: '09:00',
    endTime: '10:30',
    location: '',
  })
  const [connectionTest, setConnectionTest] = useState<{ status: 'idle' | 'testing' | 'ok' | 'error'; message: string }>({ status: 'idle', message: '' })

  const testConnection = async () => {
    if (!apiBaseUrl) {
      setConnectionTest({ status: 'error', message: 'URL non configurée. Ajoute VITE_SUPABASE_URL dans .env' })
      return
    }
    setConnectionTest({ status: 'testing', message: '' })
    try {
      const res = await fetch(`${apiBaseUrl}/session/current`, {
        headers: { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setConnectionTest({ status: 'ok', message: 'Connexion au serveur OK' })
      } else {
        const t = await res.text()
        let msg = `Erreur ${res.status}`
        if (res.status === 401) msg = 'Clé API invalide. Vérifiez VITE_SUPABASE_ANON_KEY dans .env'
        else if (res.status === 404) msg = 'Fonction Edge introuvable. Vérifiez le nom (make-server-177dbbc2) et le déploiement'
        else if (t) msg += ` — ${t.slice(0, 80)}`
        setConnectionTest({ status: 'error', message: msg })
      }
    } catch (e) {
      const isCors = e instanceof TypeError && e.message === 'Failed to fetch'
      setConnectionTest({
        status: 'error',
        message: isCors
          ? 'Réseau ou CORS : le serveur ne répond pas depuis le navigateur. Voir CONNEXION.md pour activer CORS sur la fonction Edge.'
          : (e instanceof Error ? e.message : 'Erreur inconnue'),
      })
    }
  }

  useEffect(() => {
    if (apiBaseUrl) fetchData()
  }, [apiBaseUrl, publicAnonKey])

  const fetchData = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      }
      const [sessionRes, allSessionsRes, coursesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/session/current`, { headers }),
        fetch(`${apiBaseUrl}/sessions`, { headers }),
        fetch(`${apiBaseUrl}/courses`, { headers }),
      ])
      const sessionData = await sessionRes.json()
      const allSessionsData = await allSessionsRes.json()
      const coursesData = await coursesRes.json()
      if (sessionData.success) setCurrentSession(sessionData.session)
      if (allSessionsData.success) setSessions(allSessionsData.sessions || [])
      if (coursesData.success) setCourses(coursesData.courses || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const saveSession = async () => {
    if (!sessionForm.name || !sessionForm.startDate || !sessionForm.endDate) {
      toast.error('Tous les champs sont requis')
      return
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/14a74492-d59b-4a09-8749-df57903f36a1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'SessionSetup.tsx:saveSession:entry',
        message: 'saveSession called',
        data: {
          apiBaseUrlLen: apiBaseUrl?.length ?? 0,
          publicAnonKeyLen: publicAnonKey?.length ?? 0,
          isUpdate: Boolean(sessionForm.id),
          pathSuffix: sessionForm.id ? `/session/${sessionForm.id}` : '/session',
        },
        timestamp: Date.now(),
        hypothesisId: 'H2',
      }),
    }).catch(() => {})
    // #endregion
    try {
      const isUpdate = Boolean(sessionForm.id)
      const url = isUpdate ? `${apiBaseUrl}/session/${sessionForm.id}` : `${apiBaseUrl}/session`
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/14a74492-d59b-4a09-8749-df57903f36a1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'SessionSetup.tsx:saveSession:beforeFetch',
          message: 'about to fetch',
          data: { urlPath: url.replace(apiBaseUrl, '') },
          timestamp: Date.now(),
          hypothesisId: 'H1,H3,H5',
        }),
      }).catch(() => {})
      // #endregion
      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionForm),
      })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/14a74492-d59b-4a09-8749-df57903f36a1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'SessionSetup.tsx:saveSession:afterFetch',
          message: 'fetch returned',
          data: { resStatus: res.status, resOk: res.ok },
          timestamp: Date.now(),
          hypothesisId: 'H4',
        }),
      }).catch(() => {})
      // #endregion
      let data: { success?: boolean; message?: string; error?: string } = {}
      try {
        data = await res.json()
      } catch {
        toast.error('Réponse serveur invalide')
        return
      }
      if (data.success) {
        toast.success('Session sauvegardée !')
        setSessionDialogOpen(false)
        fetchData()
        setSessionForm({ id: '', name: '', type: 'Automne', year: new Date().getFullYear(), startDate: '', endDate: '', isCurrent: false })
      } else {
        const msg = data.message || data.error || (res.status ? `Erreur ${res.status}` : 'Erreur lors de la sauvegarde')
        toast.error(msg)
      }
    } catch (e) {
      // #region agent log
      const isFailedToFetch = e instanceof TypeError && e.message === 'Failed to fetch'
      fetch('http://127.0.0.1:7242/ingest/14a74492-d59b-4a09-8749-df57903f36a1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'SessionSetup.tsx:saveSession:catch',
          message: 'saveSession catch',
          data: {
            errorType: e?.constructor?.name ?? 'unknown',
            errorMessage: e instanceof Error ? e.message : String(e),
            isFailedToFetch,
          },
          timestamp: Date.now(),
          hypothesisId: 'H1,H3,H5',
        }),
      }).catch(() => {})
      // #endregion
      console.error(e)
      toast.error(getFetchErrorMessage(e))
    }
  }

  const saveCourse = async () => {
    if (!courseForm.code || !courseForm.name) {
      toast.error('Le code et le nom sont requis')
      return
    }
    try {
      const res = await fetch(`${apiBaseUrl}/course`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...courseForm, sessionId: currentSession?.id }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Cours sauvegardé!')
        setCourseDialogOpen(false)
        fetchData()
        setCourseForm({ id: '', sessionId: '', code: '', name: '', professor: '', color: COLORS[0], credits: 3, schedule: [] })
      }
    } catch (e) {
      console.error(e)
      toast.error(getFetchErrorMessage(e))
    }
  }

  const deleteCourse = async (courseId: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/course/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Cours supprimé!')
        fetchData()
      }
    } catch (e) {
      console.error(e)
      toast.error(getFetchErrorMessage(e))
    }
  }

  const addScheduleSlot = () => {
    setCourseForm((prev) => ({ ...prev, schedule: [...prev.schedule, { ...scheduleEntry }] }))
    setScheduleEntry({ day: 1, startTime: '09:00', endTime: '10:30', location: '' })
  }

  const removeScheduleSlot = (index: number) => {
    setCourseForm((prev) => ({ ...prev, schedule: prev.schedule.filter((_, i) => i !== index) }))
  }

  const resetCourseForm = () => {
    setCourseForm({ id: '', sessionId: '', code: '', name: '', professor: '', color: COLORS[0], credits: 3, schedule: [] })
  }

  const editCourse = (course: Course) => {
    setCourseForm(course)
    setCourseDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  const currentCourses = courses.filter((c) => c.sessionId === currentSession?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Configuration des sessions</h1>
        <p className="mt-1 text-gray-500">Gérez vos sessions académiques et vos cours</p>
      </div>

      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wifi className="h-5 w-5" />
            Connexion au serveur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!apiBaseUrl ? (
            <p className="text-sm text-amber-700">
              Fichier <code className="rounded bg-gray-100 px-1">.env</code> manquant ou incomplet. Ajoutez{' '}
              <code className="rounded bg-gray-100 px-1">VITE_SUPABASE_URL</code> et{' '}
              <code className="rounded bg-gray-100 px-1">VITE_SUPABASE_ANON_KEY</code>, puis redémarrez <code className="rounded bg-gray-100 px-1">npm run dev</code>.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                URL appelée : <code className="break-all rounded bg-gray-100 px-1 text-xs">{apiBaseUrl}</code>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={testConnection} disabled={connectionTest.status === 'testing'}>
                  {connectionTest.status === 'testing' ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                  Tester la connexion
                </Button>
                {connectionTest.status === 'ok' && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> {connectionTest.message}
                  </span>
                )}
                {connectionTest.status === 'error' && (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <XCircle className="h-4 w-4" /> {connectionTest.message}
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-blue-900">
            <span className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              Session actuelle
            </span>
            <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => (currentSession ? setSessionForm(currentSession) : setSessionForm({ id: '', name: '', type: 'Automne', year: new Date().getFullYear(), startDate: '', endDate: '', isCurrent: false }))}
                >
                  {currentSession ? <Edit2 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {currentSession ? 'Modifier' : 'Créer'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{sessionForm.id ? 'Modifier la session' : 'Créer une nouvelle session'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nom de la session *</Label>
                    <Input value={sessionForm.name} onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })} placeholder="Ex: Session Automne 2024" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select value={sessionForm.type} onValueChange={(v) => setSessionForm({ ...sessionForm, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Automne">Automne</SelectItem>
                          <SelectItem value="Hiver">Hiver</SelectItem>
                          <SelectItem value="Été">Été</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Année</Label>
                      <Input type="number" value={sessionForm.year} onChange={(e) => setSessionForm({ ...sessionForm, year: parseInt(e.target.value, 10) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date de début *</Label>
                      <Input type="date" value={sessionForm.startDate} onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })} />
                    </div>
                    <div>
                      <Label>Date de fin *</Label>
                      <Input type="date" value={sessionForm.endDate} onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isCurrent"
                      checked={sessionForm.isCurrent}
                      onChange={(e) => setSessionForm({ ...sessionForm, isCurrent: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isCurrent">Définir comme session actuelle</Label>
                  </div>
                  <Button onClick={saveSession} className="w-full bg-blue-500 hover:bg-blue-600">
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentSession ? (
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-800">{currentSession.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Badge className="bg-blue-600 text-white">{currentSession.type}</Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(currentSession.startDate).toLocaleDateString('fr-FR')} - {new Date(currentSession.endDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-gray-500">Aucune session active. Créez-en une pour commencer.</p>
          )}
        </CardContent>
      </Card>

      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Mes cours ({currentCourses.length})
              </span>
              <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetCourseForm} className="bg-green-500 hover:bg-green-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un cours
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{courseForm.id ? 'Modifier le cours' : 'Ajouter un cours'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Code du cours *</Label>
                        <Input value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} placeholder="Ex: MAT101" />
                      </div>
                      <div>
                        <Label>Crédits</Label>
                        <Input type="number" value={courseForm.credits} onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value, 10) || 3 })} />
                      </div>
                    </div>
                    <div>
                      <Label>Nom du cours *</Label>
                      <Input value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} placeholder="Ex: Calcul différentiel" />
                    </div>
                    <div>
                      <Label>Professeur</Label>
                      <Input value={courseForm.professor} onChange={(e) => setCourseForm({ ...courseForm, professor: e.target.value })} placeholder="Ex: Dr. Martin Dupont" />
                    </div>
                    <div>
                      <Label>Couleur</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setCourseForm({ ...courseForm, color })}
                            className={`h-8 w-8 rounded-full border-2 transition-all ${courseForm.color === color ? 'scale-110 border-gray-900' : 'border-gray-300'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block">Horaire</Label>
                      <div className="space-y-3">
                        {courseForm.schedule.map((slot, index) => (
                          <div key={index} className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                            <span className="text-sm font-medium">{DAYS[slot.day]}</span>
                            <span className="text-sm text-gray-600">{slot.startTime} - {slot.endTime}</span>
                            {slot.location && <span className="text-sm text-gray-500">({slot.location})</span>}
                            <Button size="sm" variant="ghost" className="ml-auto text-red-500" onClick={() => removeScheduleSlot(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="grid grid-cols-4 gap-2 rounded-lg bg-blue-50 p-3">
                          <Select value={scheduleEntry.day.toString()} onValueChange={(v) => setScheduleEntry({ ...scheduleEntry, day: parseInt(v, 10) })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {DAYS.map((d, i) => (
                                <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input type="time" value={scheduleEntry.startTime} onChange={(e) => setScheduleEntry({ ...scheduleEntry, startTime: e.target.value })} />
                          <Input type="time" value={scheduleEntry.endTime} onChange={(e) => setScheduleEntry({ ...scheduleEntry, endTime: e.target.value })} />
                          <Input placeholder="Local" value={scheduleEntry.location} onChange={(e) => setScheduleEntry({ ...scheduleEntry, location: e.target.value })} />
                        </div>
                        <Button type="button" variant="outline" size="sm" className="w-full" onClick={addScheduleSlot}>
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter une plage horaire
                        </Button>
                      </div>
                    </div>
                    <Button onClick={saveCourse} className="w-full bg-green-500 hover:bg-green-600">
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder le cours
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentCourses.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <BookOpen className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                <p>Aucun cours ajouté pour cette session</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {currentCourses.map((course) => (
                  <div key={course.id} className="rounded-lg border-2 p-4 shadow-sm transition-all hover:shadow-md" style={{ borderColor: course.color }}>
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="mb-1 inline-block rounded px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: course.color }}>{course.code}</div>
                        <h4 className="font-bold text-gray-800">{course.name}</h4>
                        {course.professor && <p className="text-sm text-gray-600">{course.professor}</p>}
                        <Badge variant="outline" className="mt-1">{course.credits} crédits</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => editCourse(course)}><Edit2 className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700" onClick={() => deleteCourse(course.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    {course.schedule.length > 0 && (
                      <div className="space-y-1 border-t border-gray-200 pt-2">
                        <p className="mb-1 text-xs font-medium text-gray-500">Horaire:</p>
                        {course.schedule.map((slot, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                            <span className="font-medium">{DAYS[slot.day]}</span>
                            <span>{slot.startTime} - {slot.endTime}</span>
                            {slot.location && <span className="text-gray-500">• {slot.location}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
