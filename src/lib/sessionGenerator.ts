import type { SessionBlock, SessionPlan } from '../types'

const FOCUS_BLOCK_MIN = 60
const FOCUS_BLOCK_MAX = 90
const SHORT_BREAK = 15
const LONG_BREAK = 20

/**
 * Build a session plan: focus blocks (60–90 min) with short breaks (~15 min).
 * If total time is long enough, we add a long break once.
 */
export function generateSessionPlan(
  subjectId: string,
  subjectName: string,
  totalMinutes: number
): SessionPlan {
  const blocks: SessionBlock[] = []
  let remaining = totalMinutes
  let usedLongBreak = false

  while (remaining > 0) {
    const focusLen = Math.min(
      Math.max(FOCUS_BLOCK_MIN, remaining),
      FOCUS_BLOCK_MAX
    )
    blocks.push({
      type: 'focus',
      durationMinutes: focusLen,
      label: `${focusLen} min focus`,
    })
    remaining -= focusLen

    if (remaining <= 0) break

    const needLongBreak = !usedLongBreak && remaining >= LONG_BREAK + FOCUS_BLOCK_MIN
    const breakLen = needLongBreak ? LONG_BREAK : Math.min(SHORT_BREAK, remaining)
    blocks.push({
      type: needLongBreak ? 'longBreak' : 'shortBreak',
      durationMinutes: breakLen,
      label: needLongBreak ? `${breakLen} min long break` : `${breakLen} min break`,
    })
    remaining -= breakLen
    if (needLongBreak) usedLongBreak = true
  }

  const totalPlanned = blocks
    .filter((b) => b.type === 'focus')
    .reduce((s, b) => s + b.durationMinutes, 0)

  return {
    subjectId,
    subjectName,
    totalMinutes: totalPlanned,
    blocks,
  }
}
