import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSignIn } from '@clerk/clerk-expo'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'

export default function ForgotPasswordScreen() {
  const { signIn, isLoaded } = useSignIn()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Step 1: Send reset code to email
  const handleSendCode = async () => {
    if (!isLoaded) return

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create a password reset request
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })

      // Move to code verification step
      setStep('code')
      Alert.alert(
        'Code Sent!',
        `We've sent a verification code to ${email}. Please check your inbox.`,
        [{ text: 'OK' }]
      )
    } catch (err: any) {
      console.error('Error sending reset code:', err)
      setError(err.errors?.[0]?.message || 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify code
  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (!signIn) {
        setError('Authentication service not ready. Please try again.')
        return
      }

      // Attempt the first factor (code verification)
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      })

      if (result.status === 'needs_new_password') {
        // Move to password reset step
        setStep('password')
      } else {
        setError('Unable to verify code. Please try again.')
      }
    } catch (err: any) {
      console.error('Error verifying code:', err)
      setError(err.errors?.[0]?.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (!signIn) {
        setError('Authentication service not ready. Please try again.')
        return
      }

      // Reset the password
      const result = await signIn.resetPassword({
        password: newPassword,
      })

      if (result.status === 'complete') {
        Alert.alert(
          'Success!',
          'Your password has been reset successfully. Please sign in with your new password.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        )
      } else {
        setError('Unable to reset password. Please try again.')
      }
    } catch (err: any) {
      console.error('Error resetting password:', err)
      setError(err.errors?.[0]?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    setError('')

    try {
      if (!signIn) {
        setError('Authentication service not ready. Please try again.')
        return
      }

      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })

      Alert.alert('Code Resent!', 'A new verification code has been sent to your email.')
    } catch (err: any) {
      console.error('Error resending code:', err)
      setError(err.errors?.[0]?.message || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.back()
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Ionicons name="arrow-back" size={24} color="#22C55E" />
            </TouchableOpacity>
            <ThemedText style={styles.title}>
              {step === 'email' && 'Forgot Password?'}
              {step === 'code' && 'Verify Code'}
              {step === 'password' && 'Reset Password'}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {step === 'email' &&
                "No worries! Enter your email and we'll send you a reset code."}
              {step === 'code' && 'Enter the 6-digit code sent to your email.'}
              {step === 'password' && 'Create a new password for your account.'}
            </ThemedText>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>
                    Send Reset Code
                  </ThemedText>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: Code Verification */}
          {step === 'code' && (
            <>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="key-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
                  placeholderTextColor="#999"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleVerifyCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>
                    Verify Code
                  </ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleResendCode}
                disabled={loading}
              >
                <ThemedText style={styles.secondaryButtonText}>
                  Resend Code
                </ThemedText>
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.passwordVisibilityButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.passwordVisibilityButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordRequirements}>
                <ThemedText style={styles.requirementText}>
                  • Minimum 8 characters
                </ThemedText>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>
                    Reset Password
                  </ThemedText>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Back to Login */}
          <View style={styles.backToLoginContainer}>
            <ThemedText style={styles.backToLoginText}>
              Remember your password?{' '}
            </ThemedText>
            <TouchableOpacity onPress={handleBackToLogin}>
              <ThemedText style={styles.backToLoginLink}>Sign In</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  passwordVisibilityButton: {
    padding: 10,
  },
  passwordRequirements: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  primaryButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  backToLoginText: {
    color: '#666',
  },
  backToLoginLink: {
    color: '#22C55E',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
})
