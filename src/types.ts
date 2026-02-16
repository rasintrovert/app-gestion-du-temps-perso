/** A subject/course the user studies */
export interface Subject {
  id: string
  name: string
  color?: string
}

/** A completed or in-progress study session */
export interface StudySession {
  id: string
  subjectId: string
  subjectName: string
  startTime: string  // ISO date string
  endTime?: string   // ISO date string, set when session ends
  plannedMinutes: number
  completed: boolean
}

/** One focus block or break in a generated session plan */
export interface SessionBlock {
  type: 'focus' | 'shortBreak' | 'longBreak'
  durationMinutes: number
  label: string
}

/** Generated plan for a study session (focus blocks + breaks) */
export interface SessionPlan {
  subjectId: string
  subjectName: string
  totalMinutes: number
  blocks: SessionBlock[]
}

/** Top weekly priority */
export interface WeeklyPriority {
  id: string
  title: string
  subjectId?: string
  order: number
}

/** One fixed commitment (class, appointment) on a weekday */
export interface FixedScheduleItem {
  id: string
  day: number // 0=Monday, 6=Sunday
  startTime: string // "15:00"
  endTime: string
  label: string
  type?: 'class' | 'appointment' | 'other'
}

/** Planned study block for a subject (user fills in) */
export interface PlannedStudyBlock {
  id: string
  subjectId: string
  label: string // e.g. "Tue 10:00–12:00 Data Structures practice"
  completed: boolean
}

/** Task or deliverable per subject */
export interface TaskDeliverable {
  id: string
  subjectId: string
  text: string
  completed: boolean
}

/** Quick daily checklist item */
export interface DailyChecklistItem {
  id: string
  text: string
  completed: boolean
}

/** Weekly review (end of week) */
export interface WeeklyReview {
  wins: string
  hard: string
  adjust: string
  nextFocus: string
}

/** Academic compass (focus for the week) */
export interface AcademicCompass {
  mainFocusSubjectId: string
  mostDifficultSubjectId: string
  minStudyHoursGoal: number
}

/** Exam or deadline */
export interface ExamDeadline {
  id: string
  date: string // YYYY-MM-DD
  course: string
  action: string
}

/** Energy & life balance */
export interface EnergyBalance {
  energy: number // 1-5
  sleepAvg: string
  biggestDistraction: string
  otherNotes: string
}

/** All week-specific planner data (keyed by weekStart YYYY-MM-DD) */
export interface WeekPlannerData {
  priorities: WeeklyPriority[]
  studyBlocks: PlannedStudyBlock[]
  tasks: TaskDeliverable[]
  dailyChecklist: DailyChecklistItem[]
  review: WeeklyReview
  compass: AcademicCompass
  examsDeadlines: ExamDeadline[]
  energyBalance: EnergyBalance
}
