import { addMinutes, format, parse } from 'date-fns'
import type { FixedEvent, Preferences, ScheduleBlock, ScheduleResult, Task } from './types'

const time = (value: string) => parse(value, 'HH:mm', new Date(2024, 0, 1))
const label = (date: Date) => format(date, 'HH:mm')

export function generateSchedule(tasks: Task[], fixed: FixedEvent[], preferences: Preferences): ScheduleResult {
  const blocks: ScheduleBlock[] = fixed.map((event) => ({ id: event.id, kind: 'fixed', title: event.title, start: event.start, end: event.end }))
  const sorted = [...tasks].filter((task) => !task.completed).sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority] || b.duration - a.duration))
  let cursor = time('09:00')
  let demanding = 0
  let sinceBreak = 0
  const unscheduled: ScheduleResult['unscheduled'] = []

  for (const task of sorted) {
    if (task.energy === 'high' && demanding >= preferences.maxDemanding) { unscheduled.push({ task, reason: 'Your demanding-task limit is reached for today.' }); continue }
    let start = cursor
    const conflicting = fixed.find((event) => start < time(event.end) && addMinutes(start, task.duration) > time(event.start))
    if (conflicting) {
      const after = time(conflicting.end)
      if (after > start) start = after
    }
    if (start < time('09:00')) start = time('09:00')
    const end = addMinutes(start, task.duration)
    if (end > time('18:00')) { unscheduled.push({ task, reason: 'There is not enough open time before your day ends.' }); continue }
    const reason = task.energy === 'high' ? 'Placed in your focus window while your energy is highest.' : task.priority === 'high' ? 'Moved up because this task has a high priority.' : 'Placed after your fixed commitments with room to breathe.'
    blocks.push({ id: `block-${task.id}`, kind: 'task', taskId: task.id, title: task.title, start: label(start), end: label(end), energy: task.energy, priority: task.priority, reason, completed: task.completed })
    cursor = addMinutes(end, preferences.buffer)
    sinceBreak += task.duration
    if (sinceBreak >= preferences.breakEvery) {
      const breakEnd = addMinutes(cursor, preferences.breakLength)
      blocks.push({ id: `break-${task.id}`, kind: 'break', title: 'A little breathing room', start: label(cursor), end: label(breakEnd), reason: 'A reset keeps the next block sustainable.' })
      cursor = breakEnd
      sinceBreak = 0
    }
    if (task.energy === 'high') demanding += 1
  }
  blocks.sort((a, b) => a.start.localeCompare(b.start))
  return { blocks, unscheduled, summary: `${blocks.filter((b) => b.kind === 'task').length} tasks placed with breaks and buffers included.` }
}
