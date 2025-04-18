import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useSignIn } from '@clerk/clerk-expo'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'

export default function LoginScreen() {
  const { signIn, isLoaded, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSignIn = async () => {
    if (!isLoaded) return

    setLoading(true)
    setError('')

    try {
      // Create a sign-in attempt with email and password
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      })

      // Check if sign-in was successful
      if (signInAttempt.status === 'complete') {
        // Set the active session
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/(tabs)')
      } else {
        // Handle additional verification steps if needed
        console.log('Additional verification needed:', signInAttempt)
        setError('Additional verification needed')
      }
    } catch (err: any) {
      console.error('Error signing in:', err)
      setError(err.errors?.[0]?.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = () => {
    router.push('/(auth)/signup')
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
            />
            <ThemedText style={styles.appName}>GoGreen</ThemedText>
            <ThemedText style={styles.tagline}>
              Track your eco-friendly journeys
            </ThemedText>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
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
              />
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
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <ThemedText style={styles.forgotPasswordText}>
              Forgot Password?
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleSignIn}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.divider} />
            <ThemedText style={styles.orText}>OR</ThemedText>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            // Note: Social providers would require additional setup with Clerk
          >
            <Image
              source={require('@/assets/images/google.png')}
              style={styles.socialIcon}
            />
            <ThemedText style={styles.googleButtonText}>
              Continue with Google
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <ThemedText style={styles.signUpText}>
              Don't have an account?{' '}
            </ThemedText>
            <TouchableOpacity onPress={handleSignUp}>
              <ThemedText style={styles.signUpLink}>Sign Up</ThemedText>
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#22C55E',
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 10,
    color: '#999',
  },
  googleButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signUpText: {
    color: '#666',
  },
  signUpLink: {
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
