import type {
  Subject,
  StudySession,
  WeeklyPriority,
  FixedScheduleItem,
  WeekPlannerData,
  PlannedStudyBlock,
  TaskDeliverable,
  DailyChecklistItem,
  WeeklyReview,
  AcademicCompass,
  EnergyBalance,
} from '../types'

const SUBJECTS_KEY = 'study-coach-subjects'
const SESSIONS_KEY = 'study-coach-sessions'
const FIXED_SCHEDULE_KEY = 'study-coach-fixed-schedule'
const PRIORITIES_KEY = 'study-coach-priorities'
const WEEK_PLANNER_PREFIX = 'study-coach-week-'

const defaultSubjects: Subject[] = [
  { id: '1', name: 'Project Management', color: '#2563eb' },
  { id: '2', name: 'Data Structures', color: '#059669' },
  { id: '3', name: 'Computer Hardware', color: '#7c3aed' },
  { id: '4', name: 'Calculus 2', color: '#dc2626' },
  { id: '5', name: 'Organizational Leadership', color: '#ea580c' },
]

const defaultFixedSchedule: FixedScheduleItem[] = [
  { id: 'fs1', day: 0, startTime: '15:00', endTime: '18:00', label: 'Project Management (Class)', type: 'class' },
  { id: 'fs2', day: 2, startTime: '08:00', endTime: '10:00', label: 'Data Structures (Class)', type: 'class' },
  { id: 'fs3', day: 3, startTime: '09:00', endTime: '13:00', label: 'Computer Hardware (Class)', type: 'class' },
  { id: 'fs4', day: 3, startTime: '14:00', endTime: '17:00', label: 'Calculus 2 (Class)', type: 'class' },
  { id: 'fs5', day: 4, startTime: '14:00', endTime: '16:00', label: 'Appointment', type: 'appointment' },
  { id: 'fs6', day: 4, startTime: '16:00', endTime: '19:00', label: 'Organizational Leadership (Class)', type: 'class' },
  { id: 'fs7', day: 5, startTime: '14:00', endTime: '16:00', label: 'Rehearsal', type: 'other' },
]

const defaultDailyChecklist: DailyChecklistItem[] = [
  { id: 'dc1', text: "Review today's plan (5 minutes)", completed: false },
  { id: 'dc2', text: '1 focused study session (at least 45 minutes)', completed: false },
  { id: 'dc3', text: 'Prep for tomorrow (10 minutes)', completed: false },
]

const emptyReview: WeeklyReview = { wins: '', hard: '', adjust: '', nextFocus: '' }
const emptyCompass: AcademicCompass = { mainFocusSubjectId: '', mostDifficultSubjectId: '', minStudyHoursGoal: 0 }
const emptyEnergy: EnergyBalance = { energy: 0, sleepAvg: '', biggestDistraction: '', otherNotes: '' }

function getJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function setJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getSubjects(): Subject[] {
  const stored = getJson<Subject[]>(SUBJECTS_KEY, [])
  return stored.length > 0 ? stored : defaultSubjects
}

export function saveSubjects(subjects: Subject[]): void {
  setJson(SUBJECTS_KEY, subjects)
}

export function getSessions(): StudySession[] {
  return getJson<StudySession[]>(SESSIONS_KEY, [])
}

export function saveSessions(sessions: StudySession[]): void {
  setJson(SESSIONS_KEY, sessions)
}

export function addSession(session: StudySession): void {
  const sessions = getSessions()
  sessions.push(session)
  saveSessions(sessions)
}

export function updateSession(id: string, updates: Partial<StudySession>): void {
  const sessions = getSessions()
  const i = sessions.findIndex((s) => s.id === id)
  if (i === -1) return
  sessions[i] = { ...sessions[i], ...updates }
  saveSessions(sessions)
}

export function getPriorities(): WeeklyPriority[] {
  return getJson<WeeklyPriority[]>(PRIORITIES_KEY, [])
}

export function savePriorities(priorities: WeeklyPriority[]): void {
  setJson(PRIORITIES_KEY, priorities)
}

/** Get start of current week (Monday) in local date string YYYY-MM-DD */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

/** Study minutes this week from sessions */
export function getStudyMinutesThisWeek(): number {
  const weekStart = getWeekStart()
  const sessions = getSessions()
  return sessions
    .filter((s) => s.endTime && s.endTime.slice(0, 10) >= weekStart && s.completed)
    .reduce((sum, s) => {
      if (!s.endTime) return sum
      const start = new Date(s.startTime).getTime()
      const end = new Date(s.endTime).getTime()
      return sum + Math.round((end - start) / 60000)
    }, 0)
}

/** Completed sessions count this week */
export function getSessionsCompletedThisWeek(): number {
  const weekStart = getWeekStart()
  return getSessions().filter(
    (s) => s.completed && s.endTime && s.endTime.slice(0, 10) >= weekStart
  ).length
}

// --- Fixed schedule (same every week) ---
export function getFixedSchedule(): FixedScheduleItem[] {
  const stored = getJson<FixedScheduleItem[]>(FIXED_SCHEDULE_KEY, [])
  return stored.length > 0 ? stored : defaultFixedSchedule
}

export function saveFixedSchedule(items: FixedScheduleItem[]): void {
  setJson(FIXED_SCHEDULE_KEY, items)
}

// --- Week planner (per week) ---
function weekPlannerKey(weekStart: string): string {
  return WEEK_PLANNER_PREFIX + weekStart
}

function defaultWeekPlanner(weekStart: string, subjects: Subject[]): WeekPlannerData {
  const studyBlocks: PlannedStudyBlock[] = []
  const tasks: TaskDeliverable[] = []
  subjects.forEach((s) => {
    studyBlocks.push(
      { id: `sb-${s.id}-1-${weekStart}`, subjectId: s.id, label: 'Study block:', completed: false },
      { id: `sb-${s.id}-2-${weekStart}`, subjectId: s.id, label: 'Study block:', completed: false }
    )
    tasks.push({
      id: `task-${s.id}-${weekStart}`,
      subjectId: s.id,
      text: `${s.name}:`,
      completed: false,
    })
  })
  return {
    priorities: [],
    studyBlocks,
    tasks,
    dailyChecklist: defaultDailyChecklist.map((d) => ({ ...d, id: d.id + '-' + weekStart })),
    review: { ...emptyReview },
    compass: { ...emptyCompass },
    examsDeadlines: [],
    energyBalance: { ...emptyEnergy },
  }
}

export function getWeekPlanner(weekStart: string): WeekPlannerData {
  const subjects = getSubjects()
  const stored = getJson<WeekPlannerData | null>(weekPlannerKey(weekStart), null)
  if (stored) return stored
  return defaultWeekPlanner(weekStart, subjects)
}

export function saveWeekPlanner(weekStart: string, data: WeekPlannerData): void {
  setJson(weekPlannerKey(weekStart), data)
}

/** Week end (Sunday) from week start (Monday) */
export function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + 'T12:00:00')
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function formatWeekRange(weekStart: string, locale = 'fr-FR'): string {
  const start = new Date(weekStart + 'T12:00:00')
  const end = new Date(getWeekEnd(weekStart) + 'T12:00:00')
  const fmt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  return `${start.toLocaleDateString(locale, fmt)} → ${end.toLocaleDateString(locale, fmt)}`
}

export function getDayName(dayIndex: number): string {
  return DAY_NAMES[dayIndex] ?? ''
}
