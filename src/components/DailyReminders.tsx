import { useEffect, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { X, Calendar, Bell } from 'lucide-react'
import { toast } from 'sonner'

interface DailyRemindersProps {
  onViewPlanner: () => void
}

export function DailyReminders({ onViewPlanner }: DailyRemindersProps) {
  const [showReminder, setShowReminder] = useState(false)

  useEffect(() => {
    const lastViewed = localStorage.getItem('lastPlannerView')
    const today = new Date().toDateString()

    if (lastViewed !== today) {
      setShowReminder(true)
      setTimeout(() => {
        toast("📅 N'oublie pas de consulter ton planning!", {
          description: "C'est la première tâche de la journée",
          duration: 10000,
          action: {
            label: 'Voir le planning',
            onClick: () => {
              markPlannerViewed()
              onViewPlanner()
            },
          },
        })
      }, 2000)
    }
  }, [onViewPlanner])

  const markPlannerViewed = () => {
    const today = new Date().toDateString()
    localStorage.setItem('lastPlannerView', today)
    setShowReminder(false)
    toast.success('✅ Planning consulté!')
  }

  if (!showReminder) return null

  return (
    <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 animate-pulse">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Bell className="h-8 w-8 shrink-0 text-yellow-600 mt-1" />
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <Badge className="bg-yellow-600 text-white">Rappel important</Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowReminder(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">📋 Consulte ton planning quotidien</h3>
            <p className="mb-4 text-gray-700">
              Avant de commencer ta journée d'étude, il est essentiel de consulter ton planning pour savoir ce qui
              t'attend aujourd'hui.
            </p>
            <Button
              onClick={() => {
                markPlannerViewed()
                onViewPlanner()
              }}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Consulter mon planning
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
