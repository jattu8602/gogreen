import { Tabs } from 'expo-router'
import React from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

import { HapticTab } from '@/components/HapticTab'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useColorScheme } from '@/hooks/useColorScheme'

// Tree-themed colors
const COLORS = {
  leafGreen: '#22C55E', // Vibrant leaf green for active items
  darkGreen: '#166534', // Darker green for secondary elements
  bark: '#854D0E', // Brown bark color for accents
  soil: '#FBFBFB', // Dark soil color for inactive items
  warmGreen: '#4CAF50', // New warm green color
  notificationGreen: '#8BC34A', // New notification green color
  notificationBg: 'rgba(151, 195, 74, 0.1)', // Light notification background
}

// Custom background component for all platforms
function CustomTabBackground() {
  const colorScheme = useColorScheme()
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor:
            colorScheme === 'dark'
              ? 'rgba(42, 46, 53, 0.98)'
              : 'rgba(255, 255, 255, 0.98)',
          borderTopWidth: 1,
          borderTopColor: COLORS.darkGreen,
          borderRadius: 35,
          marginHorizontal: 0,
          overflow: 'hidden',
          width: '100%',
        },
      ]}
    />
  )
}

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.leafGreen,
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#888888' : '#666666',
        headerShown: false,
        tabBarButton: (props) => <HapticTab {...props} />,
        tabBarBackground: () => <CustomTabBackground />,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          borderRadius: 40,
          marginHorizontal: 42,
          marginBottom: Platform.OS === 'ios' ? 20 : 10,
          shadowColor: COLORS.bark,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          paddingBottom: 10,
          backgroundColor:
            colorScheme === 'dark'
              ? 'rgba(42, 46, 53, 0.98)'
              : 'rgba(255, 255, 255, 0.98)',
          width: '80%',
          borderWidth: 1,
          borderColor:
            colorScheme === 'dark'
              ? 'rgba(80, 80, 80, 0.3)'
              : 'rgba(200, 200, 200, 0.8)',
        },
        tabBarItemStyle: {
          marginTop: 7,
          marginBottom: 5,
          borderRadius: 30,
          marginHorizontal: 5,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              // Use SF Symbols on iOS (these work natively)
              <IconSymbol size={28} name="map" color={color} />
            ) : (
              // Use Material Icons directly on Android/web
              <MaterialIcons name="map" size={28} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              // Use SF Symbols on iOS (these work natively)
              <IconSymbol size={28} name="trophy" color={color} />
            ) : (
              // Use Material Icons directly on Android/web
              <MaterialIcons name="leaderboard" size={28} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="travel-planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <IconSymbol size={28} name="airplane" color={color} />
            ) : (
              <MaterialIcons name="flight" size={28} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Updates',
          tabBarIcon: ({ color }) => (
            <View style={styles.notificationIconContainer}>
              <MaterialIcons name="notifications" size={24} color={color} />
              <View style={styles.notificationBadge} />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  notificationIconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.notificationBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.notificationGreen,
    shadowColor: COLORS.notificationGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warmGreen,
    borderWidth: 1,
    borderColor: 'white',
    shadowColor: COLORS.warmGreen,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
})
