import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Clock, CheckCircle2, TrendingUp, Target, Lightbulb } from 'lucide-react'

interface Stats {
  totalHoursThisWeek?: number
  completedTasks?: number
  totalTasks?: number
  completionRate?: number
  hoursByDay?: { day: string; hours: number }[]
  byCourse?: { name: string; hours: number; color?: string }[]
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']

export function ProductivityStats({
  apiBaseUrl,
  publicAnonKey,
}: {
  apiBaseUrl: string
  publicAnonKey: string
}) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!apiBaseUrl) {
      setLoading(false)
      return
    }
    const headers = { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }
    fetch(`${apiBaseUrl}/stats`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) setStats(data.stats)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBaseUrl, publicAnonKey])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  const totalHours = stats?.totalHoursThisWeek ?? 0
  const completed = stats?.completedTasks ?? 0
  const total = stats?.totalTasks ?? 0
  const rate = stats?.completionRate ?? 0
  const avgPerDay = totalHours / 7
  const hoursByDay = stats?.hoursByDay ?? []
  const byCourse = stats?.byCourse ?? []

  const insights: string[] = []
  if (totalHours >= 10) insights.push('Excellente semaine d’étude ! Tu as dépassé 10h.')
  else if (totalHours >= 5) insights.push('Bonne régularité cette semaine.')
  else if (totalHours > 0) insights.push('Essaie d’atteindre au moins 1h par jour pour garder le rythme.')
  else insights.push('Lance une session d’étude pour commencer à enregistrer tes heures.')
  if (rate >= 80) insights.push('Taux de tâches complétées très solide.')
  else if (rate >= 50) insights.push('Continue à cocher tes tâches pour monter le taux.')
  if (avgPerDay >= 2 && totalHours > 0) insights.push('Objectif 2h/jour bien respecté.')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Statistiques de productivité</h1>
        <p className="mt-1 text-gray-500">Heures d’étude et tâches complétées</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Heures cette semaine</p>
                <p className="text-2xl font-bold text-blue-600">{totalHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tâches complétées</p>
                <p className="text-2xl font-bold text-green-600">{completed}/{total || '–'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Taux de complétion</p>
                <p className="text-2xl font-bold text-purple-600">{rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-3">
                <Target className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Moyenne / jour</p>
                <p className="text-2xl font-bold text-amber-600">{avgPerDay.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {hoursByDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Heures par jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#3b82f6" name="Heures" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {byCourse.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition par cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCourse}
                    dataKey="hours"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, hours }) => `${name} ${hours}h`}
                  >
                    {byCourse.map((_, i) => (
                      <Cell key={i} fill={byCourse[i].color ?? COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Lightbulb className="h-5 w-5" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-amber-900/90">
            {insights.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
