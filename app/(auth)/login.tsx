import React, { useState, useEffect } from 'react'
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native'
import { useSignIn } from '@clerk/clerk-expo'
import { Link, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'

import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'

export default function Login() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clerkLoadingRetries, setClerkLoadingRetries] = useState(0)

  // Monitor Clerk loading state
  useEffect(() => {
    if (!isLoaded && clerkLoadingRetries < 3) {
      const timer = setTimeout(() => {
        console.log(
          `Login: Clerk still loading... retry attempt ${
            clerkLoadingRetries + 1
          }`
        )
        setClerkLoadingRetries((prev) => prev + 1)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isLoaded, clerkLoadingRetries])

  // Clear errors when component mounts
  useEffect(() => {
    setError('')
  }, [])

  const handleSignIn = async () => {
    if (!isLoaded) {
      console.log('Login attempt failed: Clerk is not loaded yet')
      setError('Authentication service is not ready. Please try again.')
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Service not ready. Please try again.',
        position: 'bottom',
      })
      return
    }

    if (!email.trim()) {
      console.log('Login validation failed: Email is empty')
      setError('Please enter your email')
      Toast.show({
        type: 'error',
        text1: 'Missing Email',
        text2: 'Please enter your email address',
        position: 'bottom',
      })
      return
    }

    if (!password.trim()) {
      console.log('Login validation failed: Password is empty')
      setError('Please enter your password')
      Toast.show({
        type: 'error',
        text1: 'Missing Password',
        text2: 'Please enter your password',
        position: 'bottom',
      })
      return
    }

    setLoading(true)
    setError('')
    console.log('Attempting login with email:', email)

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      console.log('Sign in result status:', result.status)

      if (result.status === 'complete') {
        console.log('Login successful, setting active session')
        await setActive({ session: result.createdSessionId })
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: 'Welcome back!',
          position: 'bottom',
        })
        router.replace('/(tabs)')
      } else {
        // Handle 2FA or other additional steps if needed
        console.log('Additional authentication steps required:', result.status)
        Toast.show({
          type: 'info',
          text1: 'Additional Verification',
          text2: 'Please complete the additional verification steps',
          position: 'bottom',
        })
      }
    } catch (err: any) {
      console.error('Sign in error details:', JSON.stringify(err, null, 2))

      const errorMsg =
        err.errors?.[0]?.message ||
        'Invalid email or password. Please try again.'
      console.error('Login error message:', errorMsg)

      setError(errorMsg)
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMsg,
        position: 'bottom',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.headerContainer}>
        <ThemedText style={styles.title}>DaisyDo</ThemedText>
        <View style={styles.subtitleContainer}>
          <ThemedText style={styles.daisyEmoji}>🌼</ThemedText>
          <ThemedText style={styles.subtitle}>Login to your account</ThemedText>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#777"
            />
          </TouchableOpacity>
        </View>
      </View>

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

      <TouchableOpacity
        style={styles.signInButton}
        onPress={handleSignIn}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? 'Signing in...' : 'Sign In'}
        </ThemedText>
      </TouchableOpacity>

      <View style={styles.footerContainer}>
        <ThemedText style={styles.footerText}>
          Don't have an account?{' '}
          <Link href="/(auth)/signup">
            <ThemedText style={styles.signUpLink}>Sign Up</ThemedText>
          </Link>
        </ThemedText>
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#7C65CA',
    marginBottom: 16,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daisyEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeButton: {
    padding: 10,
  },
  signInButton: {
    height: 56,
    backgroundColor: '#7C65CA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  footerContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  signUpLink: {
    color: '#7C65CA',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
})
