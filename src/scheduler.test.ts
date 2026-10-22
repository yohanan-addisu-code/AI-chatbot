import { describe, expect, it } from 'vitest'
import { generateSchedule } from './scheduler'
import type { Task } from './types'

const tasks: Task[] = [
  { id: 'exam', title: 'Exam preparation', duration: 90, priority: 'high', energy: 'high', category: 'Study' },
  { id: 'email', title: 'Reply to emails', duration: 30, priority: 'low', energy: 'low', category: 'Admin' },
  { id: 'workout', title: 'Workout', duration: 45, priority: 'medium', energy: 'medium', category: 'Health' },
]
const preferences = { focusStart: 9, focusEnd: 12, breakEvery: 90, breakLength: 15, buffer: 10, maxDemanding: 1, flexibility: 'structured' as const }

describe('generateSchedule', () => {
  it('never overlaps fixed events and places high priority first', () => {
    const result = generateSchedule(tasks, [{ id: 'class', title: 'Class', start: '09:00', end: '10:00', category: 'School' }], preferences)
    expect(result.blocks.find((block) => block.taskId === 'exam')?.start).toBe('10:00')
  })
  it('respects demanding task limits and reports overflow', () => {
    const result = generateSchedule([...tasks, { ...tasks[0], id: 'second', title: 'Second exam' }], [], preferences)
    expect(result.unscheduled.some((item) => item.task.id === 'second')).toBe(true)
  })
  it('includes breaks after sustained work', () => {
    const result = generateSchedule(tasks, [], preferences)
    expect(result.blocks.some((block) => block.kind === 'break')).toBe(true)
  })
})
