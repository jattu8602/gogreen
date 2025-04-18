import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Platform,
  SafeAreaView,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useUser, useAuth } from '@clerk/clerk-expo'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { router } from 'expo-router'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'

// Import Firebase services
import {
  UserData,
  getUUIDFromClerkID,
  fetchLeaderboard as fetchLeaderboardData,
  updateUserProfileImage,
} from '@/lib/userService'
import { uploadImageToCloudinary } from '@/lib/cloudinary'

// Define tree-themed colors
const COLORS = {
  leafGreen: '#22C55E', // Vibrant leaf green for active items
  darkGreen: '#166534', // Darker green for secondary elements
  bark: '#854D0E', // Brown bark color for accents
  lightBark: '#A16207', // Lighter brown for secondary elements
  soil: '#57534E', // Dark soil color for inactive items
  paleGreen: 'rgba(34, 197, 94, 0.1)', // Transparent green for backgrounds
  white: '#FFFFFF', // White for contrast
  lightestGreen: '#DCFCE7', // Very light green for backgrounds
}

export default function LeaderboardScreen() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userRank, setUserRank] = useState<UserData | null>(null)
  const { user, isSignedIn } = useUser()
  const { signOut } = useAuth()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace('/(auth)/login')
    } catch (error) {
      console.error('Error signing out:', error)
      Alert.alert('Error', 'Failed to sign out. Please try again.')
    }
  }

  // Fetch leaderboard data and current user's rank
  const fetchLeaderboard = async () => {
    try {
      setRefreshing(true)
      console.log('Fetching leaderboard data...')

      try {
        // Get leaderboard data from Firebase
        const rankedUsers = await fetchLeaderboardData()

        if (!rankedUsers || rankedUsers.length === 0) {
          console.log('No leaderboard data found')
          setUsers([])
          return
        }

        console.log(`Found ${rankedUsers.length} users`)
        setUsers(rankedUsers)

        // Get current user's rank if signed in
        if (isSignedIn && user) {
          // First try to find by UUID
          const userUUID = getUUIDFromClerkID(user.id)
          let currentUser = rankedUsers.find((u) => u.id === userUUID)

          // If not found, try to find by clerk_id (for backward compatibility)
          if (!currentUser) {
            currentUser = rankedUsers.find((u) => u.clerk_id === user.id)
          }

          if (currentUser) {
            setUserRank(currentUser)
            setProfileImage(currentUser.profile_url || null)
          } else {
            console.log('Current user not found in leaderboard data')
          }
        }
      } catch (err) {
        throw err
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      Alert.alert(
        'Connection Issue',
        'Failed to load leaderboard data. Please check your internet connection and try again.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Handle profile image upload
  const handleProfileUpload = async () => {
    if (!isSignedIn) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to upload a profile photo.'
      )
      return
    }

    try {
      // Convert Clerk ID to UUID
      const userUUID = getUUIDFromClerkID(user!.id)

      // Ask user to choose source (camera or gallery)
      Alert.alert(
        'Upload Profile Photo',
        'Choose the source for your profile picture',
        [
          {
            text: 'Camera',
            onPress: () => launchCamera(userUUID),
          },
          {
            text: 'Gallery',
            onPress: () => launchGallery(userUUID),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      )
    } catch (error) {
      console.error('Error with profile image selection:', error)
    }
  }

  // Launch device camera
  const launchCamera = async (userUUID: string) => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to take a profile photo.'
        )
        return
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0], userUUID)
      }
    } catch (error) {
      console.error('Camera error:', error)
      Alert.alert('Camera Error', 'There was a problem using your camera.')
    }
  }

  // Launch gallery picker
  const launchGallery = async (userUUID: string) => {
    try {
      // Request permission
      const galleryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (galleryPermission.status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please allow access to your gallery to upload photos.'
        )
        return
      }

      // Launch gallery picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0], userUUID)
      }
    } catch (error) {
      console.error('Gallery error:', error)
      Alert.alert(
        'Gallery Error',
        'There was a problem accessing your gallery.'
      )
    }
  }

  // Upload the selected image
  const uploadImage = async (selectedImage: any, userUUID: string) => {
    try {
      setUploadingImage(true)

      // Upload to Cloudinary instead of Supabase
      console.log('Uploading to Cloudinary...')
      const { secure_url } = await uploadImageToCloudinary(
        selectedImage.uri,
        userUUID
      )

      console.log('File uploaded successfully:', secure_url)

      // Update user profile image in Firestore
      await updateUserProfileImage(userUUID, secure_url)

      setProfileImage(secure_url)
      fetchLeaderboard() // Refresh data

      Alert.alert('Success', 'Your profile photo has been updated!')
    } catch (error: any) {
      console.error('Error uploading profile image:', error)

      // More detailed error message
      let errorMessage = 'There was an error uploading your profile image.'
      if (error.message) {
        errorMessage = error.message
      } else if (error.error_description) {
        errorMessage = error.error_description
      }

      Alert.alert('Upload Failed', errorMessage)
    } finally {
      setUploadingImage(false)
    }
  }

  // Initialize data
  useEffect(() => {
    fetchLeaderboard()
  }, [isSignedIn])

  // Render a user item in the leaderboard
  const renderUserItem = ({ item }: { item: UserData }) => {
    // Check if this is the current user using both ID methods
    const isCurrentUser =
      isSignedIn &&
      user &&
      (item.id === getUUIDFromClerkID(user.id) || item.clerk_id === user.id)

    return (
      <View style={[styles.userItem, isCurrentUser && styles.currentUserItem]}>
        <ThemedText style={styles.rankText}>{item.rank}.</ThemedText>

        <View style={styles.userInfo}>
          <View style={styles.profileImageContainer}>
            {item.profile_url ? (
              <Image
                source={{ uri: item.profile_url }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="leaf" size={24} color={COLORS.leafGreen} />
              </View>
            )}
          </View>

          <ThemedText style={styles.userName}>
            {item.full_name || item.username}
          </ThemedText>
        </View>

        <View style={styles.scoreContainer}>
          <ThemedText style={styles.scoreText}>{item.green_score}</ThemedText>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('@/assets/images/leaf-pattern.png')}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.05 }}
      >
        <StatusBar style="auto" />

        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText style={styles.headerTitle}>LeaderBoard</ThemedText>
            {isSignedIn && (
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={() => setShowSignOutConfirm(true)}
              >
                <Ionicons
                  name="log-out-outline"
                  size={24}
                  color={COLORS.bark}
                />
              </TouchableOpacity>
            )}
          </View>

          {isSignedIn ? (
            <View style={styles.userProfileContainer}>
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  style={styles.profilePhotoContainer}
                  onPress={handleProfileUpload}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color={COLORS.leafGreen} />
                  ) : profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.userProfileImage}
                    />
                  ) : (
                    <View style={styles.userProfileImagePlaceholder}>
                      <Ionicons name="camera" size={24} color={COLORS.bark} />
                      <ThemedText style={styles.uploadText}>Upload</ThemedText>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.profileInfo}>
                  <ThemedText style={styles.userNameTitle}>
                    {user?.fullName || user?.username}
                  </ThemedText>

                  <ThemedText style={styles.greenScoreText}>
                    Your Green Score
                  </ThemedText>

                  <View style={styles.scoreBox}>
                    <ThemedText style={styles.userScoreText}>
                      {userRank?.green_score || 0}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <ThemedText style={styles.signInText}>
                Sign in to Track Your Impact
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.leaderboardHeader}>
          <ThemedText style={styles.leaderboardTitle}>
            Global Rankings
          </ThemedText>
          <ThemedText style={styles.leaderboardSubtitle}>
            Top green contributors
          </ThemedText>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.leafGreen} />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            refreshing={refreshing}
            onRefresh={fetchLeaderboard}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="leaf-outline"
                  size={48}
                  color={COLORS.darkGreen}
                />
                <ThemedText style={styles.emptyText}>
                  No users found. Be the first to join!
                </ThemedText>
              </View>
            }
          />
        )}

        {/* Sign out confirmation modal */}
        {showSignOutConfirm && (
          <View style={styles.confirmModalOverlay}>
            <View style={styles.confirmModal}>
              <ThemedText style={styles.confirmTitle}>Sign Out</ThemedText>
              <ThemedText style={styles.confirmText}>
                Are you sure you want to sign out?
              </ThemedText>
              <View style={styles.confirmButtonsContainer}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.cancelButton]}
                  onPress={() => setShowSignOutConfirm(false)}
                >
                  <ThemedText style={styles.confirmButtonText}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.signOutConfirmButton]}
                  onPress={() => {
                    setShowSignOutConfirm(false)
                    handleSignOut()
                  }}
                >
                  <ThemedText
                    style={[styles.confirmButtonText, styles.signOutButtonText]}
                  >
                    Sign Out
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backgroundImage: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.lightestGreen,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 197, 94, 0.2)',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  signOutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(133, 77, 14, 0.1)',
  },
  userProfileContainer: {
    marginBottom: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhotoContainer: {
    height: 80,
    width: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderWidth: 2,
    borderColor: COLORS.leafGreen,
    overflow: 'hidden',
  },
  userProfileImage: {
    height: '100%',
    width: '100%',
    borderRadius: 40,
  },
  userProfileImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 10,
    color: COLORS.bark,
    marginTop: 2,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userNameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  greenScoreText: {
    fontSize: 14,
    color: COLORS.soil,
    marginBottom: 4,
  },
  scoreBox: {
    backgroundColor: COLORS.leafGreen,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  userScoreText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: COLORS.white,
  },
  signInButton: {
    backgroundColor: COLORS.leafGreen,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 8,
  },
  signInText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  leaderboardHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  leaderboardSubtitle: {
    fontSize: 14,
    color: COLORS.soil,
    marginTop: 2,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserItem: {
    backgroundColor: COLORS.paleGreen,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 36,
    color: COLORS.darkGreen,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
  },
  profileImage: {
    height: '100%',
    width: '100%',
  },
  placeholderImage: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.bark,
  },
  scoreContainer: {
    backgroundColor: COLORS.leafGreen,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.soil,
    textAlign: 'center',
    marginTop: 12,
  },
  confirmModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmModal: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.darkGreen,
  },
  confirmText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.bark,
  },
  confirmButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  signOutConfirmButton: {
    backgroundColor: COLORS.leafGreen,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.bark,
  },
  signOutButtonText: {
    color: COLORS.white,
  },
})
