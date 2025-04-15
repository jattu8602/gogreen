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
import { useAuth, useUser } from '@clerk/clerk-expo'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'

const ProfileScreen = () => {
  const { isLoaded, signOut } = useAuth()
  const { user } = useUser()
  const [isSigningOut, setIsSigningOut] = useState(false)

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
              <ThemedText style={styles.avatarText}>
                {user?.firstName?.[0] || 'D'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.userName}>
            {user?.firstName || 'DaisyDo User'}
          </ThemedText>
          <ThemedText style={styles.userEmail}>
            {user?.primaryEmailAddress?.emailAddress}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Eco-Friendly Stats
          </ThemedText>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="leaf-outline" size={24} color="#4CAF50" />
              <ThemedText style={styles.statValue}>12</ThemedText>
              <ThemedText style={styles.statLabel}>Green Trips</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color="#4CAF50" />
              <ThemedText style={styles.statValue}>45 min</ThemedText>
              <ThemedText style={styles.statLabel}>Time Saved</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={24} color="#4CAF50" />
              <ThemedText style={styles.statValue}>$25</ThemedText>
              <ThemedText style={styles.statLabel}>Money Saved</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recent Routes</ThemedText>
          <View style={styles.routeCard}>
            <Ionicons name="navigate-outline" size={24} color="#4CAF50" />
            <View style={styles.routeInfo}>
              <ThemedText style={styles.routeTitle}>Home to Work</ThemedText>
              <ThemedText style={styles.routeDetails}>
                Most eco-friendly route
              </ThemedText>
            </View>
          </View>
          <View style={styles.routeCard}>
            <Ionicons name="navigate-outline" size={24} color="#4CAF50" />
            <View style={styles.routeInfo}>
              <ThemedText style={styles.routeTitle}>Grocery Store</ThemedText>
              <ThemedText style={styles.routeDetails}>
                Quickest route with bike lanes
              </ThemedText>
            </View>
          </View>
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
    backgroundColor: '#4CAF50',
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
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  routeCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  routeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  routeDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
})
