import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import 'react-native-reanimated'
import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SecureStore from 'expo-secure-store'
import { Alert, View, ActivityIndicator } from 'react-native'
import Toast from 'react-native-toast-message'
import FontAwesome from '@expo/vector-icons/FontAwesome'

import { useColorScheme } from '@/hooks/useColorScheme'

// Set your Clerk publishable key
// Replace this with your actual Clerk publishable key from https://dashboard.clerk.com/last-active?path=api-keys
const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  'pk_test_aGlnaC1waWdlb24tNjQuY2xlcmsuYWNjb3VudHMuZGV2JA'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

// Session persistence with SecureStore
const tokenCache = {
  async getToken(key: string) {
    try {
      console.log('Fetching token from SecureStore:', key)
      return SecureStore.getItemAsync(key)
    } catch (err) {
      console.error('Failed to get token from SecureStore:', err)
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      console.log('Saving token to SecureStore:', key)
      return SecureStore.setItemAsync(key, value)
    } catch (err) {
      console.error('Failed to save token to SecureStore:', err)
      return
    }
  },
}

// Auth state protection component
function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [redirected, setRedirected] = useState(false)
  const [clerkLoadAttempts, setClerkLoadAttempts] = useState(0)

  // Handle Clerk loading timeout
  useEffect(() => {
    if (!isLoaded && clerkLoadAttempts < 5) {
      const timer = setTimeout(() => {
        console.log(`Clerk still loading... attempt ${clerkLoadAttempts + 1}`)
        setClerkLoadAttempts((prev) => prev + 1)

        // Show a toast after a few attempts
        if (clerkLoadAttempts >= 2) {
          Toast.show({
            type: 'info',
            text1: 'Authentication Service',
            text2: 'Still connecting to auth service... Please wait',
            position: 'bottom',
            visibilityTime: 3000,
          })
        }
      }, 2000)

      return () => clearTimeout(timer)
    }

    if (!isLoaded && clerkLoadAttempts >= 5) {
      console.error('Clerk failed to load after multiple attempts')
      Toast.show({
        type: 'error',
        text1: 'Connection Issue',
        text2:
          'Could not connect to authentication service. Try restarting the app.',
        position: 'bottom',
        visibilityTime: 4000,
      })
    }
  }, [isLoaded, clerkLoadAttempts])

  useEffect(() => {
    console.log('Auth state changed:', { isLoaded, isSignedIn, segments })

    if (!isLoaded) {
      console.log('Clerk is still loading...')
      return
    }

    const inAuthGroup = segments[0] === '(auth)'

    // Only redirect if we haven't already to prevent infinite loops
    if (!redirected) {
      if (isSignedIn && inAuthGroup) {
        // Redirect to home if signed in and in auth group
        console.log('User is signed in and in auth group, redirecting to home')
        router.replace('/(tabs)')
        setRedirected(true)
      } else if (!isSignedIn && !inAuthGroup) {
        // Redirect to sign in if not signed in and not in auth group
        console.log(
          'User is not signed in and not in auth group, redirecting to login'
        )
        router.replace('/(auth)/login')
        setRedirected(true)
      }
    }
  }, [isSignedIn, segments, isLoaded, redirected])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="index" />
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  })

  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded) {
      console.log('Fonts loaded, hiding splash screen')
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    console.log('Fonts not loaded yet')
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    )
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <SafeAreaProvider>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <StatusBar style="auto" />
          <InitialLayout />
          <Toast />
        </ThemeProvider>
      </SafeAreaProvider>
    </ClerkProvider>
  )
}
