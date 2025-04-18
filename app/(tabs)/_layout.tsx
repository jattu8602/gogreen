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
  soil: '#57534E', // Dark soil color for inactive items
}

// Custom background component for Android and other platforms
function CustomTabBackground() {
  const colorScheme = useColorScheme()
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor:
            colorScheme === 'dark'
              ? 'rgba(42, 46, 53, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
          borderTopWidth: 1,
          borderTopColor: COLORS.darkGreen,
          borderRadius: 15,
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
        tabBarInactiveTintColor: COLORS.soil,
        headerShown: false,
        tabBarButton: (props) => <HapticTab {...props} />,
        tabBarBackground:
          Platform.OS === 'ios'
            ? undefined // Uses the platform-specific TabBarBackground.ios.tsx
            : () => <CustomTabBackground />,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          borderRadius: 15,
          marginHorizontal: 10,
          marginBottom: Platform.OS === 'ios' ? 20 : 10,
          shadowColor: COLORS.bark,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
        },
        tabBarItemStyle: {
          marginTop: 5,
          marginBottom: 5,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
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
          title: 'Travel Planner',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <IconSymbol size={28} name="airplane" color={color} />
            ) : (
              <MaterialIcons name="flight" size={28} color={color} />
            ),
        }}
      />
    </Tabs>
  )
}
