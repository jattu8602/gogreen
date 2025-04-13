import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'

import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'

// Task type definition
type Task = {
  id: string
  title: string
  time?: string
  color: string
  hasReminder?: boolean
  hasAttachment?: boolean
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

export default function Calendar() {
  // Sample date - using a fixed date to match the image
  const [selectedMonth, setSelectedMonth] = useState(10) // November (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2022)
  const [selectedDay, setSelectedDay] = useState(13)

  // Sample tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Supermarket shopping list.',
      time: '12:30',
      color: '#a29bfe',
      hasReminder: true,
      hasAttachment: true,
    },
    { id: '2', title: 'Send Email to Tim.', color: '#ff7675' },
    {
      id: '3',
      title: 'Have a glass of water.',
      time: '14:45',
      color: '#ffeaa7',
      hasReminder: true,
      hasAttachment: true,
    },
  ])

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
        hasEvents: [11, 12, 23].includes(i), // Days with dot indicators
      })
    }

    // Next month days
    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1
    const nextMonthYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear
    const totalDaysShown = 42 // 6 rows of 7 days
    const remainingDays =
      totalDaysShown - prevMonthDays.length - currentMonthDays.length

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
    const textColor = day.isCurrentMonth
      ? day.isSelected
        ? 'white'
        : 'black'
      : '#aaa'
    const backgroundColor = day.isSelected ? '#74b9ff' : 'transparent'

    return (
      <View key={index} style={styles.dayCell}>
        <View style={[styles.dayContainer, { backgroundColor }]}>
          <ThemedText style={[styles.dayText, { color: textColor }]}>
            {day.day}
          </ThemedText>
          {day.hasEvents && (
            <View style={styles.dotContainer}>
              <View style={styles.dot} />
            </View>
          )}
        </View>
      </View>
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
        <ThemedText style={styles.taskTitle}>{item.title}</ThemedText>
        {item.time && (
          <View style={styles.taskMeta}>
            <ThemedText style={styles.taskTime}>{item.time}</ThemedText>
            {item.hasReminder && (
              <Ionicons
                name="notifications-outline"
                size={16}
                color="#777"
                style={styles.taskIcon}
              />
            )}
            {item.hasAttachment && (
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

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Calendar</ThemedText>
        <ThemedText style={styles.headerSubtitle}>View</ThemedText>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.monthSelector}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color="#555" />
          </TouchableOpacity>
          <ThemedText style={styles.monthYearText}>NOV, 2022</ThemedText>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#555" />
          </TouchableOpacity>
          <View style={styles.monthControls}>
            <TouchableOpacity>
              <Ionicons name="chevron-down" size={24} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="ellipsis-vertical" size={24} color="#555" />
            </TouchableOpacity>
          </View>
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
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        style={styles.tasksList}
      />

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#FFF8F0',
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  monthControls: {
    flexDirection: 'row',
    gap: 10,
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
    padding: 2,
  },
  dayContainer: {
    width: '80%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  dayText: {
    fontSize: 18,
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
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
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
})
