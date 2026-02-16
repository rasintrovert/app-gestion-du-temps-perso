import { useState } from 'react'
import type { Subject, SessionPlan } from '../types'
import { getSubjects } from '../lib/storage'
import { generateSessionPlan } from '../lib/sessionGenerator'
import FocusTimer from './FocusTimer'
import './SessionGenerator.css'

const DURATION_OPTIONS = [30, 60, 90, 120, 180]

interface SessionGeneratorProps {
  onBack: () => void
}

export default function SessionGenerator({ onBack }: SessionGeneratorProps) {
  const subjects = getSubjects()
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')
  const [minutes, setMinutes] = useState(60)
  const [plan, setPlan] = useState<SessionPlan | null>(null)
  const [timerActive, setTimerActive] = useState(false)

  const subject = subjects.find((s) => s.id === subjectId)
  const subjectName = subject?.name ?? 'Study'

  const handleGenerate = () => {
    const p = generateSessionPlan(subjectId, subjectName, minutes)
    setPlan(p)
  }

  const handleStartTimer = () => {
    setTimerActive(true)
  }

  const handleTimerComplete = () => {
    setTimerActive(false)
    setPlan(null)
    onBack()
  }

  const handleTimerCancel = () => {
    setTimerActive(false)
  }

  if (timerActive && plan) {
    return (
      <FocusTimer
        subjectId={plan.subjectId}
        subjectName={plan.subjectName}
        blocks={plan.blocks}
        onComplete={handleTimerComplete}
        onCancel={handleTimerCancel}
      />
    )
  }

  return (
    <div className="session-generator">
      <h2>New study session</h2>
      <button type="button" className="back" onClick={onBack}>
        ← Back
      </button>

      <label>
        <span>Subject</span>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>

      <label>
        <span>Available time (minutes)</span>
        <select
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        >
          {DURATION_OPTIONS.map((m) => (
            <option key={m} value={m}>{m} min</option>
          ))}
        </select>
      </label>

      <button type="button" className="primary" onClick={handleGenerate}>
        Generate plan
      </button>

      {plan && (
        <div className="plan-preview">
          <h3>Plan: {plan.subjectName}</h3>
          <ul>
            {plan.blocks.map((b, i) => (
              <li key={i}>
                {b.type === 'focus' ? '📚' : '☕'} {b.label}
              </li>
            ))}
          </ul>
          <button type="button" className="primary" onClick={handleStartTimer}>
            Start session
          </button>
        </div>
      )}
    </div>
  )
}
