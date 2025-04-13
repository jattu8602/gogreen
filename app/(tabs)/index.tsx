import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as DocumentPicker from 'expo-document-picker'

import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { supabase } from '@/lib/supabase'

// Task type definition
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

// Define the day type for better TypeScript support
type CalendarDay = {
  day: number
  month: number
  year: number
  isCurrentMonth: boolean
  isSelected?: boolean
  hasEvents?: boolean
}

const CalendarScreen = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    priority: 'medium',
    is_daily: false,
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [years, setYears] = useState<number[]>([])
  const [selectedTime, setSelectedTime] = useState(new Date())

  // Generate years for picker
  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const yearsArray = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i)
    setYears(yearsArray)
    fetchTasks()
  }, [selectedYear, selectedMonth])

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('year', selectedYear)
      .eq('month', selectedMonth)

    if (error) {
      console.error('Error fetching tasks:', error)
      return
    }

    setTasks(data || [])
  }

  // Generate calendar days
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear)

    // Previous month days
    const prevMonthDays = []
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1
    const prevMonthYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear
    const daysInPrevMonth = getDaysInMonth(prevMonth, prevMonthYear)

    for (let i = 0; i < firstDay; i++) {
      const day = daysInPrevMonth - firstDay + i + 1
      prevMonthDays.push({
        day,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
      })
    }

    // Current month days
    const currentMonthDays = []
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        day: i,
        month: selectedMonth,
        year: selectedYear,
        isCurrentMonth: true,
        isSelected: i === selectedDay,
      })
    }

    // Next month days
    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1
    const nextMonthYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear
    const totalDaysShown = 42 // 6 rows of 7 days
    const remainingDays = totalDaysShown - prevMonthDays.length - currentMonthDays.length

    const nextMonthDays = []
    for (let i = 1; i <= remainingDays; i++) {
      nextMonthDays.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false,
      })
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
  }

  const days = generateCalendarDays()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const renderDay = (day: CalendarDay, index: number) => {
    const isSelected = day.day === selectedDay && day.month === selectedMonth && day.year === selectedYear
    const textColor = day.isCurrentMonth
      ? isSelected
        ? 'white'
        : 'black'
      : '#aaa'
    const backgroundColor = isSelected ? '#74b9ff' : 'transparent'

    return (
      <TouchableOpacity
        key={index}
        style={[styles.dayCell, { backgroundColor }]}
        onPress={() => {
          setSelectedDay(day.day)
          setSelectedMonth(day.month)
          setSelectedYear(day.year)
        }}
        activeOpacity={0.7}
      >
        <ThemedText style={[styles.dayText, { color: textColor }]}>
          {day.day}
        </ThemedText>
      </TouchableOpacity>
    )
  }

  const renderWeekDay = (day: string) => (
    <View key={day} style={styles.weekDayCell}>
      <ThemedText style={styles.weekDayText}>{day}</ThemedText>
    </View>
  )

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <View style={[styles.taskColorBar, { backgroundColor: item.color }]} />
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <ThemedText style={styles.taskTitle}>{item.title}</ThemedText>
          {item.is_daily && (
            <View style={styles.dailyBadge}>
              <Ionicons name="repeat" size={16} color="#666" />
              <ThemedText style={styles.dailyText}>Daily</ThemedText>
            </View>
          )}
        </View>
        {item.time && (
          <View style={styles.taskMeta}>
            <ThemedText style={styles.taskTime}>{item.time}</ThemedText>
            {item.has_reminder && (
              <Ionicons
                name="notifications-outline"
                size={16}
                color="#777"
                style={styles.taskIcon}
              />
            )}
            {item.has_attachment && (
              <Ionicons
                name="attach"
                size={16}
                color="#777"
                style={styles.taskIcon}
              />
            )}
          </View>
        )}
      </View>
      <View style={styles.taskFlag}>
        {item.id === '2' && (
          <Ionicons name="flag-outline" size={18} color="#777" />
        )}
        {item.id === '3' && (
          <Ionicons name="flag-outline" size={18} color="#777" />
        )}
      </View>
    </View>
  )

  const renderMonthSelector = () => (
    <View style={styles.monthSelector}>
      <ThemedText style={styles.monthYearText}>
        {monthNames[selectedMonth]}, {selectedYear}
      </ThemedText>
    </View>
  )

  const renderYearPicker = () => (
    <Modal
      visible={showYearPicker}
      transparent
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedYear}
            onValueChange={(value) => {
              setSelectedYear(value)
              setShowYearPicker(false)
            }}
          >
            {years.map((year) => (
              <Picker.Item key={year} label={year.toString()} value={year} />
            ))}
          </Picker>
        </View>
      </View>
    </Modal>
  )

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false)
    if (selectedDate) {
      setSelectedTime(selectedDate)
      setNewTask({
        ...newTask,
        time: selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    }
  }

  const handleAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })

      if (result.canceled) return

      const file = result.assets[0]
      if (!file) return

      // Create a unique file path with user's ID
      const fileExt = file.name.split('.').pop() || 'file'
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${selectedYear}/${selectedMonth}/${selectedDay}/${fileName}`

      // Create a FormData object for the file
      const formData = new FormData()
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/octet-stream',
        name: file.name,
      } as any)

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, formData)

      if (error) {
        console.error('Error uploading file:', error)
        return
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

      setNewTask({
        ...newTask,
        has_attachment: true,
        attachment_url: publicUrl || '',
      })
    } catch (error) {
      console.error('Error picking document:', error)
    }
  }

  const saveTask = async () => {
    const taskToSave = {
      ...newTask,
      year: selectedYear,
      month: selectedMonth,
      day: selectedDay,
      is_completed: false,
    }

    const { error } = await supabase.from('tasks').insert([taskToSave])

    if (error) {
      console.error('Error saving task:', error)
      return
    }

    setShowTaskModal(false)
    setNewTask({ priority: 'medium', is_daily: false })
    fetchTasks()
  }

  const renderTaskModal = () => (
    <Modal
      visible={showTaskModal}
      transparent
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.taskModalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add New Task</ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTaskModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <TextInput
              style={styles.input}
              placeholder="Task Title"
              value={newTask.title}
              onChangeText={(text) => setNewTask({ ...newTask, title: text })}
            />

            <View style={styles.dateSelectionContainer}>
              <ThemedText style={styles.sectionTitle}>Select Date</ThemedText>
              <View style={styles.yearMonthSelector}>
                <TouchableOpacity
                  style={styles.yearButton}
                  onPress={() => setShowYearPicker(true)}
                >
                  <ThemedText style={styles.yearButtonText}>{selectedYear}</ThemedText>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.monthScroll}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.monthButton,
                        selectedMonth === i && styles.selectedMonth,
                      ]}
                      onPress={() => setSelectedMonth(i)}
                    >
                      <ThemedText
                        style={[
                          styles.monthText,
                          selectedMonth === i && styles.selectedMonthText,
                        ]}
                      >
                        {monthNames[i].substring(0, 3)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.calendarGrid}>
                {weekDays.map((day) => (
                  <View key={day} style={styles.weekDayCell}>
                    <ThemedText style={styles.weekDayText}>{day}</ThemedText>
                  </View>
                ))}
                {days.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      day.isCurrentMonth && styles.currentMonthDay,
                      day.day === selectedDay && styles.selectedDay,
                    ]}
                    onPress={() => {
                      setSelectedDay(day.day)
                      setSelectedMonth(day.month)
                      setSelectedYear(day.year)
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.dayText,
                        !day.isCurrentMonth && styles.otherMonthDay,
                        day.day === selectedDay && styles.selectedDayText,
                      ]}
                    >
                      {day.day}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.priorityContainer}>
              <ThemedText>Priority:</ThemedText>
              <View style={styles.priorityButtons}>
                {['high', 'medium', 'low'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      newTask.priority === priority && styles.selectedPriority
                    ]}
                    onPress={() => setNewTask({ ...newTask, priority: priority as Task['priority'] })}
                  >
                    <ThemedText>{priority}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <ThemedText style={styles.timeButtonText}>
                {newTask.time || 'Set Time'}
              </ThemedText>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                onChange={handleTimeChange}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                is24Hour={true}
              />
            )}

            <View style={styles.switchContainer}>
              <ThemedText>Daily Task</ThemedText>
              <Switch
                value={newTask.is_daily}
                onValueChange={(value) => setNewTask({ ...newTask, is_daily: value })}
              />
            </View>

            {newTask.is_daily && (
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  // Implement date picker for end date
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <ThemedText style={styles.dateButtonText}>
                  {newTask.end_date || 'Set End Date'}
                </ThemedText>
              </TouchableOpacity>
            )}

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes"
              multiline
              value={newTask.notes}
              onChangeText={(text) => setNewTask({ ...newTask, notes: text })}
            />

            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={handleAttachment}
            >
              <Ionicons name="attach-outline" size={20} color="#666" />
              <ThemedText style={styles.attachmentButtonText}>
                {newTask.has_attachment ? 'Change Attachment' : 'Add Attachment'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveTask}
            >
              <ThemedText style={styles.saveButtonText}>Save Task</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (task.is_daily) {
        // Show daily tasks for all dates
        return true
      } else {
        // Show non-daily tasks only for the selected date
        return (
          task.year === selectedYear &&
          task.month === selectedMonth &&
          task.day === selectedDay
        )
      }
    })
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      {renderMonthSelector()}
      {renderYearPicker()}
      {renderTaskModal()}

      <View style={styles.calendarCard}>
        <View style={styles.monthSelector}>
          <ThemedText style={styles.monthYearText}>
            {monthNames[selectedMonth]}, {selectedYear}
          </ThemedText>
        </View>

        <View style={styles.calendar}>
          <View style={styles.weekDaysRow}>
            {weekDays.map((day) => renderWeekDay(day))}
          </View>
          <View style={styles.daysGrid}>
            {days.map((day, index) => renderDay(day, index))}
          </View>
        </View>
      </View>

      <FlatList
        data={getFilteredTasks()}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        style={styles.tasksList}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowTaskModal(true)}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </ThemedView>
  )
}

export default CalendarScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#FFF8F0',
    paddingTop: 30,

  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#103783',
  },
  headerSubtitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#103783',
  },
  calendarCard: {
    margin: 16,
    backgroundColor: '#E6F4FF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendar: {
    padding: 8,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dotContainer: {
    position: 'absolute',
    bottom: 2,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#74b9ff',
  },
  tasksList: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: '#F2F8FF',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskColorBar: {
    width: 5,
    backgroundColor: '#8e44ad',
  },
  taskContent: {
    flex: 1,
    padding: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    fontSize: 14,
    color: '#777',
    marginRight: 8,
  },
  taskIcon: {
    marginRight: 8,
  },
  taskFlag: {
    justifyContent: 'center',
    paddingRight: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  yearText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 16,
  },
  monthScroll: {
    flex: 1,
  },
  monthButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  selectedMonth: {
    backgroundColor: '#74b9ff',
  },
  monthText: {
    fontSize: 16,
  },
  selectedMonthText: {
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 12,
    padding: 16,
  },
  taskModalContent: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  dateSelectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  yearMonthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 10,
  },
  yearButtonText: {
    fontSize: 16,
    marginRight: 4,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 10,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  priorityButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedPriority: {
    backgroundColor: '#74b9ff',
    borderColor: '#74b9ff',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
  timeButtonText: {
    marginLeft: 8,
    color: '#666',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
  dateButtonText: {
    marginLeft: 8,
    color: '#666',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
  attachmentButtonText: {
    marginLeft: 8,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#74b9ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  timePicker: {
    width: '100%',
    height: 200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedDay: {
    backgroundColor: '#74b9ff',
    borderRadius: 8,
  },
  selectedDayText: {
    color: 'white',
  },
  currentMonthDay: {
    backgroundColor: 'white',
  },
  otherMonthDay: {
    color: '#aaa',
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dailyText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
})
