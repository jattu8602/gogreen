import React from 'react'
import { StyleSheet } from 'react-native'
import TaskModal from './TaskModal'
import { ThemedText } from '@/components/ThemedText'

// We're reusing the Task type from TaskModal
type Task = {
  id: string
  title: string
  time?: string
  color: string
  has_reminder?: boolean
  has_attachment?: boolean
  priority: 'high' | 'medium' | 'low'
  notes?: string
  is_daily?: boolean
  end_date?: string
  is_completed?: boolean
  year: number
  month: number
  day: number
  reminder_frequency?: string
  attachment_url?: string
}

// CalendarDay type
type CalendarDay = {
  day: number
  month: number
  year: number
  isCurrentMonth: boolean
  isSelected?: boolean
  hasEvents?: boolean
}

type DailyTaskModalProps = {
  visible: boolean
  onClose: () => void
  onSave: (task: Partial<Task>) => void
  selectedYear: number
  selectedMonth: number
  selectedDay: number
  task: Partial<Task>
  setTask: (task: Partial<Task>) => void
  handleAttachment: () => void
  monthNames: string[]
  weekDays: string[]
  days: CalendarDay[]
}

const DailyTaskModal = (props: DailyTaskModalProps) => {
  // When this component mounts, ensure the task is set to daily
  React.useEffect(() => {
    if (!props.task.is_daily) {
      props.setTask({
        ...props.task,
        is_daily: true,
        color: '#000000', // Black color for daily tasks
      })
    }
  }, [props.visible])

  return <TaskModal {...props} task={props.task} />
}

export default DailyTaskModal
