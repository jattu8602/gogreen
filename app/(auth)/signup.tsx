import React, { useState, useEffect } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'

import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clerkLoadingRetries, setClerkLoadingRetries] = useState(0)

  // Monitor Clerk loading state
  useEffect(() => {
    if (!isLoaded && clerkLoadingRetries < 3) {
      const timer = setTimeout(() => {
        console.log(
          `Signup: Clerk still loading... retry attempt ${
            clerkLoadingRetries + 1
          }`
        )
        setClerkLoadingRetries((prev) => prev + 1)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isLoaded, clerkLoadingRetries])

  const handleSignUp = async () => {
    if (!isLoaded) {
      console.log('Clerk is not loaded yet')
      setError('Authentication service is not ready. Please try again.')
      Toast.show({
        type: 'error',
        text1: 'Service Not Ready',
        text2:
          'Authentication service is still initializing. Please try again in a moment.',
        position: 'bottom',
      })
      return
    }

    // Validate inputs
    if (!email.trim()) {
      console.log('Signup validation failed: Email is empty')
      setError('Please enter your email')
      Toast.show({
        type: 'error',
        text1: 'Missing Email',
        text2: 'Please enter your email address',
        position: 'bottom',
      })
      return
    }

    if (!username.trim()) {
      console.log('Signup validation failed: Username is empty')
      setError('Please enter a username')
      Toast.show({
        type: 'error',
        text1: 'Missing Username',
        text2: 'Please enter a username',
        position: 'bottom',
      })
      return
    }

    if (password.length < 8) {
      console.log('Signup validation failed: Password too short')
      setError('Password must be at least 8 characters')
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Password must be at least 8 characters',
        position: 'bottom',
      })
      return
    }

    if (password !== confirmPassword) {
      console.log('Signup validation failed: Passwords do not match')
      setError('Passwords do not match')
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'The passwords you entered do not match',
        position: 'bottom',
      })
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Starting signup process with email:', email)

      // Create the user account with username
      const result = await signUp.create({
        emailAddress: email,
        username,
        password,
      })

      console.log('Signup result status:', result.status)

      if (result.status === 'missing_requirements') {
        // Prepare email verification
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        console.log('Email verification prepared successfully')

        Toast.show({
          type: 'success',
          text1: 'Account Created',
          text2: 'Please verify your email to continue',
          position: 'bottom',
        })

        // Navigate to verification screen with context
        router.push({
          pathname: '/(auth)/verify-email',
          params: { email, username },
        })
        return
      }

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Account created successfully!',
          position: 'bottom',
        })
        router.replace('/(tabs)')
        return
      }

      console.log('Unexpected signup status:', result.status)
      setError('Unexpected error during signup. Please try again.')
      Toast.show({
        type: 'error',
        text1: 'Signup Error',
        text2: 'An unexpected error occurred. Please try again.',
        position: 'bottom',
      })
    } catch (err: any) {
      console.error('Signup error details:', JSON.stringify(err, null, 2))

      let errorMessage = 'An error occurred during signup.'
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message || errorMessage
        console.error('Error code:', err.errors[0].code)
        console.error('Error long message:', err.errors[0].longMessage)
      }

      setError(errorMessage)
      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: errorMessage,
        position: 'bottom',
      })

      if (errorMessage.includes('email') && errorMessage.includes('already')) {
        Alert.alert(
          'Account Exists',
          'An account with this email already exists. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
          ]
        )
      } else {
        Alert.alert('Signup Error', errorMessage, [{ text: 'OK' }])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={48} color="#4CAF50" />
        </View>
        <ThemedText style={styles.title}>GoGreen</ThemedText>
        <ThemedText style={styles.subtitle}>
          Join our eco-friendly community
        </ThemedText>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="mail-outline"
            size={24}
            color="#4CAF50"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#90A4AE"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons
            name="person-outline"
            size={24}
            color="#4CAF50"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholderTextColor="#90A4AE"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons
            name="lock-closed-outline"
            size={24}
            color="#4CAF50"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.passwordInput}
            placeholder="Create Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#90A4AE"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color="#4CAF50"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons
            name="lock-closed-outline"
            size={24}
            color="#4CAF50"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            placeholderTextColor="#90A4AE"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color="#4CAF50"
            />
          </TouchableOpacity>
        </View>
      </View>

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

      <TouchableOpacity
        style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </ThemedText>
      </TouchableOpacity>

      <View style={styles.footerContainer}>
        <ThemedText style={styles.footerText}>
          Already have an account?{' '}
          <Link href="/(auth)/login" asChild>
            <ThemedText style={styles.signInLink}>Sign In</ThemedText>
          </Link>
        </ThemedText>
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#66BB6A',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#424242',
  },
  passwordInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#424242',
  },
  eyeButton: {
    padding: 8,
  },
  signUpButton: {
    height: 56,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signUpButtonDisabled: {
    backgroundColor: '#A5D6A7',
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
    color: '#757575',
  },
  signInLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
  },
})
