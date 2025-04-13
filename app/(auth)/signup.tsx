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

    setLoading(true)
    setError('')

    try {
      console.log('Starting signup process with email:', email)

      // Only use email and password for signup
      const result = await signUp.create({
        emailAddress: email,
        password,
      })

      console.log('Signup result status:', result.status)

      // Start the email verification process
      try {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        console.log('Email verification prepared successfully')
        Toast.show({
          type: 'success',
          text1: 'Account Created',
          text2: 'Please verify your email to continue',
          position: 'bottom',
        })

        // Navigate to verification screen
        router.push('/(auth)/verify-email')
      } catch (verifyErr) {
        console.error('Error preparing email verification:', verifyErr)
        Toast.show({
          type: 'error',
          text1: 'Verification Error',
          text2: 'Could not set up email verification',
          position: 'bottom',
        })
        Alert.alert(
          'Verification Setup Error',
          'We encountered an issue setting up email verification. Please try again or contact support.',
          [{ text: 'OK' }]
        )
        setError('Error setting up verification. Please try again.')
      }
    } catch (err: any) {
      console.error('Signup error details:', JSON.stringify(err, null, 2))

      // Extract the specific error message
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
        <ThemedText style={styles.title}>DaisyDo</ThemedText>
        <View style={styles.subtitleContainer}>
          <ThemedText style={styles.daisyEmoji}>🌼</ThemedText>
          <ThemedText style={styles.subtitle}>Create your account</ThemedText>
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
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#777"
            />
          </TouchableOpacity>
        </View>
      </View>

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

      <TouchableOpacity
        style={styles.signUpButton}
        onPress={handleSignUp}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? 'Creating Account...' : 'Sign Up'}
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
  signUpButton: {
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
  signInLink: {
    color: '#7C65CA',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
})
