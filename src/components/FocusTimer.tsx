import { useState, useEffect, useRef } from 'react'
import type { SessionBlock } from '../types'
import { addSession, updateSession } from '../lib/storage'
import './FocusTimer.css'

interface FocusTimerProps {
  subjectId: string
  subjectName: string
  blocks: SessionBlock[]
  onComplete: () => void
  onCancel: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function FocusTimer({
  subjectId,
  subjectName,
  blocks,
  onComplete,
  onCancel,
}: FocusTimerProps) {
  const [blockIndex, setBlockIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionCreatedRef = useRef(false)

  const block = blocks[blockIndex]
  const isFocus = block?.type === 'focus'

  // Create one session when timer starts (first focus block)
  useEffect(() => {
    if (sessionCreatedRef.current || !blocks.length) return
    const firstFocus = blocks.find((b) => b.type === 'focus')
    if (!firstFocus) return
    const id = crypto.randomUUID()
    setSessionId(id)
    sessionCreatedRef.current = true
    addSession({
      id,
      subjectId,
      subjectName,
      startTime: new Date().toISOString(),
      plannedMinutes: blocks.filter((b) => b.type === 'focus').reduce((s, b) => s + b.durationMinutes, 0),
      completed: false,
    })
  }, [subjectId, subjectName, blocks])

  // Initialize current block duration
  useEffect(() => {
    if (block) {
      setSecondsLeft(block.durationMinutes * 60)
    }
  }, [blockIndex, block?.durationMinutes])

  // Tick
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, secondsLeft])

  // When a block reaches 0, go to next or finish
  useEffect(() => {
    if (secondsLeft !== 0) return
    if (!block) return
    if (blockIndex < blocks.length - 1) {
      setBlockIndex((i) => i + 1)
      const next = blocks[blockIndex + 1]
      if (next) setSecondsLeft(next.durationMinutes * 60)
    } else {
      if (sessionId) {
        updateSession(sessionId, {
          endTime: new Date().toISOString(),
          completed: true,
        })
      }
      onComplete()
    }
  }, [secondsLeft, blockIndex, blocks.length, block, sessionId, onComplete])

  const toggleRunning = () => setIsRunning((r) => !r)

  if (!block) return null

  return (
    <div className="focus-timer">
      <p className="timer-label">
        {isFocus ? 'Focus' : 'Break'} — {block.label}
      </p>
      <p className="timer-subject">{subjectName}</p>
      <p className="timer-display">{formatTime(secondsLeft)}</p>
      <div className="timer-actions">
        <button type="button" className="primary" onClick={toggleRunning}>
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button type="button" onClick={onCancel}>Cancel session</button>
      </div>
      <p className="timer-progress">
        Block {blockIndex + 1} of {blocks.length}
      </p>
    </div>
  )
}
