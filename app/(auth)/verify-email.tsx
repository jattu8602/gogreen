import React, { useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Toast from 'react-native-toast-message'

import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'

export default function VerifyEmail() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async () => {
    if (!isLoaded) {
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
    console.log('Attempting email verification with code:', code)

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      })

      console.log('Verification result status:', result.status)

      if (result.status === 'complete') {
        console.log('Email verification successful, setting active session')
        await setActive({ session: result.createdSessionId })
        Toast.show({
          type: 'success',
          text1: 'Verification Successful',
          text2: 'Your email has been verified!',
          position: 'bottom',
        })
        router.replace('/(tabs)')
      } else {
        console.log(
          'Verification incomplete, additional steps needed:',
          result.status
        )
        setError('Verification incomplete. Please contact support.')
        Toast.show({
          type: 'info',
          text1: 'Verification Incomplete',
          text2: 'Please complete additional steps to verify your account',
          position: 'bottom',
        })
      }
    } catch (err: any) {
      console.error('Verification error details:', JSON.stringify(err, null, 2))
      const errorMsg = err.errors?.[0]?.message || 'Failed to verify email.'
      console.error('Verification error message:', errorMsg)

      setError(errorMsg)
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: errorMsg,
        position: 'bottom',
      })

      // Show alert for critical errors
      if (errorMsg.includes('expired') || errorMsg.includes('invalid')) {
        Alert.alert('Verification Error', errorMsg, [{ text: 'OK' }])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!isLoaded) {
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

    console.log('Attempting to resend verification code')
    try {
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      })
      console.log('Verification code resent successfully')
      setError('')
      Toast.show({
        type: 'success',
        text1: 'Code Resent',
        text2: 'A new verification code has been sent to your email',
        position: 'bottom',
      })
    } catch (err: any) {
      console.error('Resend code error details:', JSON.stringify(err, null, 2))
      const errorMsg =
        err.errors?.[0]?.message || 'Failed to resend verification code.'
      console.error('Resend code error message:', errorMsg)

      setError(errorMsg)
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: errorMsg,
        position: 'bottom',
      })
    }
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.headerContainer}>
        <ThemedText style={styles.title}>Verify your email</ThemedText>
        <ThemedText style={styles.subtitle}>
          Please enter the verification code sent to your email
        </ThemedText>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Verification Code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />
      </View>

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

      <TouchableOpacity
        style={styles.verifyButton}
        onPress={handleVerify}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify Email'}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton} onPress={handleResendCode}>
        <ThemedText style={styles.resendText}>Resend Code</ThemedText>
      </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7C65CA',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  verifyButton: {
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
  resendButton: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  resendText: {
    color: '#7C65CA',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
})
