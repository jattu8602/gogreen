import React, { useState, useEffect } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Toast from 'react-native-toast-message'
import { Ionicons } from '@expo/vector-icons'

import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'

export default function VerifyEmail() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const params = useLocalSearchParams()
  const email = params.email as string
  const username = params.username as string

  useEffect(() => {
    const checkSignUpSession = async () => {
      if (!signUp?.emailAddress) {
        console.log('No active signup session found')
        Toast.show({
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please try signing up again',
          position: 'bottom',
        })
        router.replace('/(auth)/signup')
      }
    }
    checkSignUpSession()
  }, [signUp])

  const handleVerify = async () => {
    if (!isLoaded || !signUp) {
      console.log('Verification failed: Clerk is not loaded yet')
      setError('Authentication service is not ready. Please try again.')
      Toast.show({
        type: 'error',
        text1: 'Service Not Ready',
        text2: 'Authentication service is initializing. Please try again.',
        position: 'bottom',
      })
      return
    }

    if (!code.trim()) {
      console.log('Verification failed: Code is empty')
      setError('Please enter the verification code')
      Toast.show({
        type: 'error',
        text1: 'Missing Code',
        text2: 'Please enter the verification code sent to your email',
        position: 'bottom',
      })
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Starting verification process...')

      // First, verify the email address
      const verificationAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      console.log('Email verification status:', verificationAttempt.status)

      if (verificationAttempt.status === 'missing_requirements') {
        console.log('Verification successful, completing signup...')

        // The email is verified, now complete the signup
        const completeSignUp = await signUp.create({
          emailAddress: signUp.emailAddress || email,
          username: signUp.username || username,
        })

        console.log('Signup completion status:', completeSignUp.status)

        if (completeSignUp.status === 'complete') {
          await setActive({ session: completeSignUp.createdSessionId })
          Toast.show({
            type: 'success',
            text1: 'Welcome to GoGreen!',
            text2: 'Your account has been created successfully.',
            position: 'bottom',
          })
          router.replace('/(tabs)')
          return
        }

        throw new Error('Failed to complete signup after verification')
      }

      if (verificationAttempt.status === 'complete') {
        await setActive({ session: verificationAttempt.createdSessionId })
        Toast.show({
          type: 'success',
          text1: 'Welcome to GoGreen!',
          text2: 'Your email has been verified successfully.',
          position: 'bottom',
        })
        router.replace('/(tabs)')
        return
      }

      throw new Error(
        `Unexpected verification status: ${verificationAttempt.status}`
      )
    } catch (err: any) {
      console.error('Verification error:', err)
      let errorMessage = 'Failed to verify email.'

      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message
        console.error('Error details:', {
          code: err.errors[0].code,
          message: err.errors[0].message,
          longMessage: err.errors[0].longMessage,
        })
      }

      setError(errorMessage)
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: errorMessage,
        position: 'bottom',
      })

      if (errorMessage.includes('expired')) {
        Alert.alert(
          'Code Expired',
          'The verification code has expired. Would you like to request a new one?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Send New Code', onPress: handleResendCode },
          ]
        )
      } else if (errorMessage.includes('invalid')) {
        Alert.alert(
          'Invalid Code',
          'The code you entered is invalid. Please check and try again.',
          [{ text: 'OK' }]
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) {
      console.log('Resend code failed: Clerk is not loaded yet')
      setError('Authentication service is not ready. Please try again.')
      Toast.show({
        type: 'error',
        text1: 'Service Not Ready',
        text2: 'Please try again in a moment',
        position: 'bottom',
      })
      return
    }

    setLoading(true)
    console.log('Requesting new verification code...')

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      })

      console.log('New verification code sent successfully')
      setError('')
      setCode('')

      Toast.show({
        type: 'success',
        text1: 'Code Sent',
        text2: 'A new verification code has been sent to your email',
        position: 'bottom',
      })
    } catch (err: any) {
      console.error('Failed to resend code:', err)
      const errorMsg = err.errors?.[0]?.message || 'Failed to send new code.'

      setError(errorMsg)
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
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
        <View style={styles.logoContainer}>
          <Ionicons name="mail-unread" size={48} color="#4CAF50" />
        </View>
        <ThemedText style={styles.title}>Verify Your Email</ThemedText>
        <ThemedText style={styles.subtitle}>
          Enter the 6-digit code sent to {signUp?.emailAddress || email}
        </ThemedText>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="key-outline"
            size={24}
            color="#4CAF50"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter verification code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#90A4AE"
            editable={!loading}
          />
        </View>
      </View>

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

      <TouchableOpacity
        style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <ThemedText style={styles.buttonText}>Verify Email</ThemedText>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResendCode}
        disabled={loading}
      >
        <Ionicons
          name="refresh-outline"
          size={20}
          color={loading ? '#A5D6A7' : '#4CAF50'}
          style={styles.resendIcon}
        />
        <ThemedText
          style={[styles.resendText, loading && styles.resendTextDisabled]}
        >
          Resend Code
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <ThemedText
          style={[styles.cancelText, loading && styles.cancelTextDisabled]}
        >
          Cancel
        </ThemedText>
      </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#66BB6A',
    textAlign: 'center',
    paddingHorizontal: 32,
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
  verifyButton: {
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
  verifyButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    flexDirection: 'row',
    marginTop: 24,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendIcon: {
    marginRight: 8,
  },
  resendText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: '#A5D6A7',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelTextDisabled: {
    color: '#BDBDBD',
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
  },
})
