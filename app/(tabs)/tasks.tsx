import React, { useState } from 'react'
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'

type Task = {
  id: string
  title: string
  completed: boolean
}

export default function Tasks() {
  // Sample tasks data
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Complete project proposal', completed: false },
    { id: '2', title: 'Meeting with client', completed: false },
    { id: '3', title: 'Review documentation', completed: true },
  ])

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <View
        style={[
          styles.taskStatus,
          { backgroundColor: item.completed ? '#4CAF50' : '#FFC107' },
        ]}
      />
      <ThemedText style={styles.taskTitle}>{item.title}</ThemedText>
    </View>
  )

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Today's Tasks</ThemedText>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        style={styles.taskList}
      />

      <TouchableOpacity style={styles.addButton}>
        <ThemedText style={styles.addButtonText}>+</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
  },
  taskStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    fontSize: 24,
    color: 'white',
  },
})
