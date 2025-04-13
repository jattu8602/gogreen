import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '@clerk/clerk-expo'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { supabase } from '@/lib/supabase'

type Task = {
  id: string
  title: string
  time?: string
  color: string
  hasReminder?: boolean
  hasAttachment?: boolean
  priority: 'high' | 'medium' | 'low'
  notes?: string
  isDaily?: boolean
  endDate?: string
  isCompleted?: boolean
}

type AnalyticsData = {
  labels: string[]
  data: number[]
}

const { width } = Dimensions.get('window')
const CHART_HEIGHT = 200
const BAR_WIDTH = 30
const SPACING = 10

const CustomBarChart = ({ data }: { data: AnalyticsData }) => {
  const maxValue = Math.max(...data.data)
  const scale = CHART_HEIGHT / maxValue

  return (
    <View style={styles.chartContainer}>
      {data.data.map((value, index) => {
        const barHeight = value * scale
        return (
          <View key={index} style={styles.barContainer}>
            <View style={[styles.bar, { height: barHeight }]} />
            <ThemedText style={styles.barLabel}>{data.labels[index]}</ThemedText>
          </View>
        )
      })}
    </View>
  )
}

const ProfileScreen = () => {
  const { isLoaded, signOut, userId } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [dailyTasks, setDailyTasks] = useState<Task[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [3, 5, 2, 4, 6, 1, 4],
  })

  useEffect(() => {
    fetchDailyTasks()
    fetchAnalytics()
  }, [])

  const fetchDailyTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('isDaily', true)

    if (error) {
      console.error('Error fetching daily tasks:', error)
      return
    }

    setDailyTasks(data || [])
  }

  const fetchAnalytics = async () => {
    // This is a simplified version. In a real app, you'd fetch actual data
    const mockData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [3, 5, 2, 4, 6, 1, 4],
    }
    setAnalyticsData(mockData)
  }

  const handleSignOut = async () => {
    if (!isLoaded) return

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true)
              await signOut()
              router.replace('/(auth)/login')
            } catch (error) {
              console.error('Error signing out:', error)
              Alert.alert('Error', 'Failed to sign out. Please try again.')
            } finally {
              setIsSigningOut(false)
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  const renderDailyTask = (task: Task) => (
    <View key={task.id} style={styles.dailyTaskItem}>
      <View style={styles.dailyTaskContent}>
        <ThemedText style={styles.dailyTaskTitle}>{task.title}</ThemedText>
        {task.time && (
          <View style={styles.taskMeta}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <ThemedText style={styles.taskTime}>{task.time}</ThemedText>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => {
          // Implement edit functionality
        }}
      >
        <Ionicons name="create-outline" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  )

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <ThemedText style={styles.logoutText}>
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>D</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.userName}>DaisyDo User</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Work-Life Balance</ThemedText>
          <CustomBarChart data={analyticsData} />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Daily Routine Tasks</ThemedText>
          {dailyTasks.map(renderDailyTask)}
        </View>
      </ScrollView>
    </ThemedView>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  logoutText: {
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#74b9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    paddingVertical: 20,
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: '#74b9ff',
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
  },
  dailyTaskItem: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  dailyTaskContent: {
    flex: 1,
  },
  dailyTaskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    marginLeft: 4,
    color: '#666',
  },
  editButton: {
    padding: 8,
  },
})

