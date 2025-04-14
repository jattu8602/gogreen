import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { ThemedText } from '@/components/ThemedText'

// Task type definition
type Task = {
  id: string
  title: string
  description?: string
  time?: string
  color: string
  has_reminder?: boolean
  priority: 'high' | 'medium' | 'low'
  is_completed?: boolean
  year: number
  month: number
  day: number
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

type TaskModalProps = {
  visible: boolean
  onClose: () => void
  onSave: (task: Partial<Task>) => void
  selectedYear: number
  selectedMonth: number
  selectedDay: number
  task: Partial<Task>
  setTask: (task: Partial<Task>) => void
  monthNames: string[]
  weekDays: string[]
  days: CalendarDay[]
}

const TaskModal = ({
  visible,
  onClose,
  onSave,
  selectedYear,
  selectedMonth,
  selectedDay,
  task,
  setTask,
  monthNames,
  weekDays,
  days,
}: TaskModalProps) => {
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedTime, setSelectedTime] = useState(new Date())
  const [description, setDescription] = useState('')

  // Set default color to red and reminder to true when component mounts
  React.useEffect(() => {
    if (!task.color) {
      setTask({
        ...task,
        color: '#FF3B30',
        has_reminder: true,
        year: selectedYear,
        month: selectedMonth,
        day: selectedDay,
      })
    }

    // Initialize local description state if task has description
    if (task.description) {
      setDescription(task.description)
    }
  }, [])

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false)
    if (selectedDate) {
      setSelectedTime(selectedDate)
      setTask({
        ...task,
        time: selectedDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    }
  }

  const handleSaveTask = () => {
    // Create a new object without the description field
    const { description: _, ...taskToSave } = task

    onSave({
      ...taskToSave,
      color: taskToSave.is_completed ? '#34C759' : '#FF3B30',
      year: selectedYear,
      month: selectedMonth,
      day: selectedDay,
    })
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.taskModalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add New Task</ThemedText>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Selected Date Display */}
          <View style={styles.selectedDateContainer}>
            <Ionicons name="calendar" size={20} color="#FF3B30" />
            <ThemedText style={styles.selectedDateText}>
              {monthNames[selectedMonth]} {selectedDay}, {selectedYear}
            </ThemedText>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Task Title Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="create-outline"
                size={22}
                color="#FF3B30"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Task Title"
                value={task.title}
                onChangeText={(text) => setTask({ ...task, title: text })}
                placeholderTextColor="#999"
              />
            </View>

            {/* Task Description Input */}
            <View style={styles.descriptionContainer}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color="#FF3B30"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.descriptionInput}
                placeholder="Task Description"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Time Selection */}
            <View style={styles.timeSection}>
              <ThemedText style={styles.sectionTitle}>Time</ThemedText>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.timeButtonContent}>
                  <Ionicons name="time-outline" size={24} color="#FF3B30" />
                  <View style={styles.timeTextContainer}>
                    <ThemedText style={styles.timeValue}>
                      {task.time || 'Set task time'}
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                onChange={handleTimeChange}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                is24Hour={true}
              />
            )}

            {/* Priority Selection */}
            <View style={styles.priorityContainer}>
              <ThemedText style={styles.sectionTitle}>Priority</ThemedText>
              <View style={styles.priorityButtons}>
                {[
                  { value: 'high', label: 'High', color: '#FF3B30' },
                  { value: 'medium', label: 'Medium', color: '#FF9500' },
                  { value: 'low', label: 'Low', color: '#34C759' },
                ].map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityButton,
                      task.priority === priority.value && {
                        backgroundColor: priority.color,
                      },
                    ]}
                    onPress={() =>
                      setTask({
                        ...task,
                        priority: priority.value as Task['priority'],
                      })
                    }
                  >
                    <ThemedText
                      style={[
                        styles.priorityText,
                        task.priority === priority.value &&
                          styles.selectedPriorityText,
                      ]}
                    >
                      {priority.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reminder Option */}
            <View style={styles.reminderContainer}>
              <View style={styles.reminderHeader}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#FF3B30"
                />
                <View style={styles.reminderTextContainer}>
                  <ThemedText style={styles.reminderText}>Reminder</ThemedText>
                  <ThemedText style={styles.reminderSubtext}>
                    You will be notified 5 minutes before the set time
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={task.has_reminder}
                onValueChange={(value) =>
                  setTask({ ...task, has_reminder: value })
                }
                trackColor={{ false: '#E0E0E0', true: '#FF3B3050' }}
                thumbColor={task.has_reminder ? '#FF3B30' : '#FFF'}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveTask}
            >
              <ThemedText style={styles.saveButtonText}>Save Task</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
  },
  taskModalContent: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 10,
    marginBottom: 18,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
  },
  modalScrollView: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 22,
    minHeight: 120,
  },
  descriptionInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    height: '100%',
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  timeSection: {
    marginBottom: 22,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  timeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeTextContainer: {
    marginLeft: 12,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  priorityContainer: {
    marginBottom: 22,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  priorityText: {
    fontWeight: '500',
    fontSize: 15,
    color: '#555',
  },
  selectedPriorityText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reminderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 24,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTextContainer: {
    marginLeft: 12,
  },
  reminderText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  reminderSubtext: {
    fontSize: 12,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
})

export default TaskModal
