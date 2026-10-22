export type Priority = 'high' | 'medium' | 'low'
export type Energy = 'high' | 'medium' | 'low'
export type BlockKind = 'task' | 'fixed' | 'break' | 'buffer'

export interface Task {
  id: string
  title: string
  description?: string
  duration: number
  priority: Priority
  energy: Energy
  deadline?: string
  category: string
  completed?: boolean
}

export interface FixedEvent { id: string; title: string; start: string; end: string; category: string }
export interface Preferences { focusStart: number; focusEnd: number; breakEvery: number; breakLength: number; buffer: number; maxDemanding: number; flexibility: 'structured' | 'flexible' }
export interface ScheduleBlock { id: string; kind: BlockKind; title: string; start: string; end: string; taskId?: string; energy?: Energy; priority?: Priority; reason?: string; completed?: boolean }
export interface ScheduleResult { blocks: ScheduleBlock[]; unscheduled: Array<{ task: Task; reason: string }>; summary: string }
