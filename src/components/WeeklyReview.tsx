import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Plus, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface WeeklyReviewProps {
  apiBaseUrl: string
  publicAnonKey: string
}

function getCurrentWeekKey() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  return start.toISOString().split('T')[0]
}

export function WeeklyReview({ apiBaseUrl, publicAnonKey }: WeeklyReviewProps) {
  const [wins, setWins] = useState<string[]>([''])
  const [challenges, setChallenges] = useState<string[]>([''])
  const [adjustments, setAdjustments] = useState('')
  const [nextWeekFocus, setNextWeekFocus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (apiBaseUrl) fetchReview()
  }, [apiBaseUrl, publicAnonKey])

  const fetchReview = async () => {
    try {
      const weekKey = getCurrentWeekKey()
      const res = await fetch(`${apiBaseUrl}/review/${weekKey}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      })
      const data = await res.json()
      if (data.success && data.review) {
        const r = data.review
        setWins(r.wins?.length > 0 ? r.wins : [''])
        setChallenges(r.challenges?.length > 0 ? r.challenges : [''])
        setAdjustments(r.adjustments ?? '')
        setNextWeekFocus(r.nextWeekFocus ?? '')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const saveReview = async () => {
    try {
      const weekKey = getCurrentWeekKey()
      const res = await fetch(`${apiBaseUrl}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekKey,
          wins: wins.filter((w) => w.trim() !== ''),
          challenges: challenges.filter((c) => c.trim() !== ''),
          adjustments,
          nextWeekFocus,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Revue hebdomadaire sauvegardée!')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const addWin = () => setWins((p) => [...p, ''])
  const removeWin = (i: number) => setWins((p) => p.filter((_, idx) => idx !== i))
  const updateWin = (i: number, v: string) => setWins((p) => p.map((x, idx) => (idx === i ? v : x)))
  const addChallenge = () => setChallenges((p) => [...p, ''])
  const removeChallenge = (i: number) => setChallenges((p) => p.filter((_, idx) => idx !== i))
  const updateChallenge = (i: number, v: string) => setChallenges((p) => p.map((x, idx) => (idx === i ? v : x)))

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">Revue hebdomadaire</h1>
        <p className="mt-1 text-gray-500">Semaine du {new Date(getCurrentWeekKey()).toLocaleDateString('fr-FR')}</p>
      </div>

      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-green-900">
            <span>🎉 Réussites de la semaine</span>
            <Button size="sm" variant="outline" className="bg-white" onClick={addWin}>
              <Plus className="mr-1 h-4 w-4" />
              Ajouter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {wins.map((win, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={win} onChange={(e) => updateWin(i, e.target.value)} placeholder="Ex: J'ai terminé mon projet en avance" className="flex-1 bg-white" />
              {wins.length > 1 && (
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => removeWin(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-orange-900">
            <span>🚧 Défis rencontrés</span>
            <Button size="sm" variant="outline" className="bg-white" onClick={addChallenge}>
              <Plus className="mr-1 h-4 w-4" />
              Ajouter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {challenges.map((ch, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={ch} onChange={(e) => updateChallenge(i, e.target.value)} placeholder="Ex: J'ai eu du mal à me concentrer" className="flex-1 bg-white" />
              {challenges.length > 1 && (
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => removeChallenge(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">🔧 Ajustements pour la semaine prochaine</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={adjustments} onChange={(e) => setAdjustments(e.target.value)} placeholder="Ex: Je vais planifier mes sessions le dimanche soir..." rows={4} className="bg-white" />
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-900">🎯 Focus de la semaine prochaine</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={nextWeekFocus} onChange={(e) => setNextWeekFocus(e.target.value)} placeholder="Ex: Préparer mon examen de chimie..." rows={4} className="bg-white" />
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={saveReview} className="h-14 bg-green-500 px-8 text-lg hover:bg-green-600">
          <Save className="mr-2 h-5 w-5" />
          Sauvegarder la revue
        </Button>
      </div>

      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-indigo-900">💡 Recommandations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-white/60 p-3">
            <p className="text-sm text-gray-700"><strong>Astuce:</strong> Planifie tes sessions les plus difficiles le matin.</p>
          </div>
          <div className="rounded-lg bg-white/60 p-3">
            <p className="text-sm text-gray-700"><strong>Suggestion:</strong> Utilise la méthode Pomodoro pour les tâches que tu as du mal à démarrer.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
