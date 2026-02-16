import { useState, useEffect } from 'react'
import type { WeekPlannerData, PlannedStudyBlock, TaskDeliverable, DailyChecklistItem } from '../types'
import type { DashboardProps } from '../App'
import {
  getWeekStart,
  getWeekPlanner,
  saveWeekPlanner,
  getFixedSchedule,
  getSubjects,
  getStudyMinutesThisWeek,
  getSessionsCompletedThisWeek,
  formatWeekRange,
  getDayName,
} from '../lib/storage'
import './Dashboard.css'

export default function Dashboard({ onStartSession }: DashboardProps) {
  const weekStart = getWeekStart()
  const [planner, setPlanner] = useState<WeekPlannerData>(() => getWeekPlanner(weekStart))
  const fixedSchedule = getFixedSchedule()
  const subjects = getSubjects()

  useEffect(() => {
    setPlanner(getWeekPlanner(weekStart))
  }, [weekStart])

  const save = (next: WeekPlannerData) => {
    setPlanner(next)
    saveWeekPlanner(weekStart, next)
  }

  const updatePriorities = (index: number, title: string) => {
    const prio = [...planner.priorities]
    while (prio.length <= index) prio.push({ id: crypto.randomUUID(), title: '', order: prio.length })
    prio[index] = { ...prio[index], title, order: index }
    save({ ...planner, priorities: prio })
  }

  const toggleStudyBlock = (id: string) => {
    save({
      ...planner,
      studyBlocks: planner.studyBlocks.map((b) =>
        b.id === id ? { ...b, completed: !b.completed } : b
      ),
    })
  }

  const updateStudyBlockLabel = (id: string, label: string) => {
    save({
      ...planner,
      studyBlocks: planner.studyBlocks.map((b) => (b.id === id ? { ...b, label } : b)),
    })
  }

  const toggleTask = (id: string) => {
    save({
      ...planner,
      tasks: planner.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    })
  }

  const updateTaskText = (id: string, text: string) => {
    save({
      ...planner,
      tasks: planner.tasks.map((t) => (t.id === id ? { ...t, text } : t)),
    })
  }

  const toggleDailyChecklist = (id: string) => {
    save({
      ...planner,
      dailyChecklist: planner.dailyChecklist.map((c) =>
        c.id === id ? { ...c, completed: !c.completed } : c
      ),
    })
  }

  const updateReview = (field: keyof typeof planner.review, value: string) => {
    save({ ...planner, review: { ...planner.review, [field]: value } })
  }

  const updateCompass = (field: keyof typeof planner.compass, value: string | number) => {
    save({
      ...planner,
      compass: { ...planner.compass, [field]: value },
    })
  }

  const updateEnergy = (field: keyof typeof planner.energyBalance, value: string | number) => {
    save({
      ...planner,
      energyBalance: { ...planner.energyBalance, [field]: value },
    })
  }

  const minutesThisWeek = getStudyMinutesThisWeek()
  const hoursThisWeek = (minutesThisWeek / 60).toFixed(1)
  const sessionsCompleted = getSessionsCompletedThisWeek()
  const goalHours = planner.compass.minStudyHoursGoal || 0
  const focusRate = sessionsCompleted > 0 ? Math.min(100, Math.round((sessionsCompleted / (sessionsCompleted + 2)) * 100)) : 0

  const scheduleByDay = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    name: getDayName(i),
    items: fixedSchedule.filter((f) => f.day === i),
  }))

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Weekly Planner (Feb–May)</h1>
        <p className="week-range">Week of: {formatWeekRange(weekStart)}</p>
      </header>

      {/* Top 3 Priorities */}
      <section className="dashboard-section priorities-section">
        <h2>📌 This week's priorities (Top 3)</h2>
        <ul className="priorities-list">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <input
                type="text"
                value={planner.priorities[i]?.title ?? ''}
                onChange={(e) => updatePriorities(i, e.target.value)}
                placeholder={`Priority ${i + 1}`}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Fixed schedule */}
      <section className="dashboard-section">
        <h2>Fixed schedule (classes + commitments)</h2>
        <div className="fixed-schedule">
          {scheduleByDay.map(({ day, name, items }) => (
            <div key={day} className="schedule-day">
              <h3>{name}</h3>
              {items.length === 0 ? (
                <p className="muted">{day === 6 ? 'Weekly reset (planning + light review)' : 'No classes'}</p>
              ) : (
                <ul>
                  {items.map((item) => (
                    <li key={item.id}>
                      {item.startTime.slice(0, 5)}–{item.endTime.slice(0, 5)} — {item.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Study time blocks */}
      <section className="dashboard-section">
        <h2>Study time blocks (plan your week)</h2>
        <p className="aside">⏱️ Fill these in with realistic blocks (e.g. "Tue 10:00–12:00 Data Structures practice").</p>
        <div className="study-blocks-by-subject">
          {subjects.map((subj) => {
            const blocks = planner.studyBlocks.filter((b) => b.subjectId === subj.id)
            return (
              <div key={subj.id} className="subject-blocks">
                <h3>{subj.name}</h3>
                <ul>
                  {blocks.map((b) => (
                    <li key={b.id} className="block-row">
                      <input
                        type="checkbox"
                        checked={b.completed}
                        onChange={() => toggleStudyBlock(b.id)}
                        aria-label="Completed"
                      />
                      <input
                        type="text"
                        className="block-label"
                        value={b.label}
                        onChange={(e) => updateStudyBlockLabel(b.id, e.target.value)}
                        placeholder="Study block:"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Tasks & deliverables */}
      <section className="dashboard-section">
        <h2>Tasks & deliverables (this week)</h2>
        <ul className="tasks-list">
          {planner.tasks.map((t) => {
            const subj = subjects.find((s) => s.id === t.subjectId)
            return (
              <li key={t.id} className="task-row">
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => toggleTask(t.id)}
                  aria-label="Done"
                />
                <input
                  type="text"
                  value={t.text}
                  onChange={(e) => updateTaskText(t.id, e.target.value)}
                  placeholder={subj?.name + ':'}
                />
              </li>
            )
          })}
        </ul>
      </section>

      {/* Quick daily checklist */}
      <section className="dashboard-section">
        <h2>Quick daily checklist</h2>
        <ul className="daily-checklist">
          {planner.dailyChecklist.map((c) => (
            <li key={c.id}>
              <input
                type="checkbox"
                checked={c.completed}
                onChange={() => toggleDailyChecklist(c.id)}
              />
              <span>{c.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Academic Compass + Generate Study Day + Progress */}
      <section className="dashboard-section compass-section">
        <h2>🎯 Academic Compass</h2>
        <div className="compass-fields">
          <label>
            Main focus subject this week:
            <select
              value={planner.compass.mainFocusSubjectId}
              onChange={(e) => updateCompass('mainFocusSubjectId', e.target.value)}
            >
              <option value="">—</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            Most difficult subject:
            <select
              value={planner.compass.mostDifficultSubjectId}
              onChange={(e) => updateCompass('mostDifficultSubjectId', e.target.value)}
            >
              <option value="">—</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            Minimum study hours goal:
            <input
              type="number"
              min={0}
              step={0.5}
              value={planner.compass.minStudyHoursGoal || ''}
              onChange={(e) => updateCompass('minStudyHoursGoal', parseFloat(e.target.value) || 0)}
            />
            h
          </label>
        </div>

        <div className="generate-study-day">
          <h3>▶️ Generate a Deep Study Day</h3>
          <button type="button" className="primary big" onClick={onStartSession}>
            Choose subject & time → Start study timer
          </button>
        </div>

        <div className="progress-tracking">
          <h3>📊 Progress this week</h3>
          <p><strong>Total study hours:</strong> {hoursThisWeek} / Goal {goalHours || '—'} h</p>
          <p><strong>Sessions completed:</strong> {sessionsCompleted}</p>
          <p><strong>Focus success rate:</strong> {focusRate}%</p>
        </div>
      </section>

      {/* Exams & deadlines */}
      <section className="dashboard-section">
        <h2>📅 Exams & Deadlines</h2>
        <p className="muted">Date — Course — Action (add in a future update)</p>
        {planner.examsDeadlines.length === 0 && (
          <p className="muted">No deadlines entered yet.</p>
        )}
      </section>

      {/* Energy & balance */}
      <section className="dashboard-section">
        <h2>⚖️ Energy & Life Balance</h2>
        <div className="energy-fields">
          <label>Energy (1–5): <input type="number" min={1} max={5} value={planner.energyBalance.energy || ''} onChange={(e) => updateEnergy('energy', parseInt(e.target.value, 10) || 0)} /></label>
          <label>Sleep avg: <input type="text" value={planner.energyBalance.sleepAvg} onChange={(e) => updateEnergy('sleepAvg', e.target.value)} placeholder="e.g. 7h" /></label>
          <label>Biggest distraction: <input type="text" value={planner.energyBalance.biggestDistraction} onChange={(e) => updateEnergy('biggestDistraction', e.target.value)} /></label>
          <label>Exercise • Spiritual • Family: <input type="text" value={planner.energyBalance.otherNotes} onChange={(e) => updateEnergy('otherNotes', e.target.value)} /></label>
        </div>
      </section>

      {/* Weekly review */}
      <section className="dashboard-section">
        <h2>🔍 Weekly Review</h2>
        <div className="review-fields">
          <label>Wins: <textarea value={planner.review.wins} onChange={(e) => updateReview('wins', e.target.value)} rows={2} /></label>
          <label>What was hard: <textarea value={planner.review.hard} onChange={(e) => updateReview('hard', e.target.value)} rows={2} /></label>
          <label>What to change next week: <textarea value={planner.review.adjust} onChange={(e) => updateReview('adjust', e.target.value)} rows={2} /></label>
          <label>Next week's focus: <textarea value={planner.review.nextFocus} onChange={(e) => updateReview('nextFocus', e.target.value)} rows={2} /></label>
        </div>
      </section>
    </div>
  )
}
