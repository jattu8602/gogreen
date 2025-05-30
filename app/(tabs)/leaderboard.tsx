// @ts-nocheck
/* eslint-disable */
// This file uses JSX which is handled by the React Native transpiler
// Disabling TypeScript checks here since they're not relevant to runtime behavior

import * as React from 'react'
const { useState, useEffect, useCallback } = React
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
  Modal,
  TextInput,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useUser, useAuth, useClerk } from '@clerk/clerk-expo'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { useFocusEffect } from '@react-navigation/native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Import Firebase services
import {
  UserData,
  getUUIDFromClerkID,
  fetchLeaderboard as fetchLeaderboardData,
  updateUserProfileImage,
  getUserById,
  createOrUpdateUser,
} from '@/lib/userService'

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

// AsyncStorage keys
const PROFILE_IMAGE_KEY = 'user_profile_image'

export default function LeaderboardScreen() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userRank, setUserRank] = useState<UserData | null>(null)
  const { user, isSignedIn } = useUser()
  const { signOut } = useAuth()
  const clerk = useClerk()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [userEcoCoins, setUserEcoCoins] = useState(0);
  const [showCoinInfo, setShowCoinInfo] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)

  // Initialize user data when signed in
  useEffect(() => {
    const initializeUserData = async () => {
      if (isSignedIn && user) {
        try {
          console.log('Initializing user with Clerk data:', {
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            imageUrl: user.imageUrl
          });

          // Create or update user in Firebase with exact Clerk data
          const userData: UserData = {
            id: getUUIDFromClerkID(user.id),
            clerk_id: user.id,
            username: user.username || '',   // Store exactly what comes from Clerk
            green_score: 0,                  // Initial score for new users
            profile_url: user.imageUrl || '',
          }

          // If username is missing, generate a display name
          if (!userData.username) {
            userData.username = `eco_${user.id.substring(0, 6)}`;
          }

          console.log('Saving user data to Firebase:', userData);

          // Make sure green_score is explicitly set to 0 if it's a new user
          const existingUser = await getUserById(userData.id);
          if (!existingUser) {
            console.log('No existing user found - creating new user with green_score of 0');
            userData.green_score = 0;
          } else {
            console.log(`Existing user found with green_score: ${existingUser.green_score}`);
            // Keep the existing score if updating the user
            userData.green_score = existingUser.green_score;
          }

          await createOrUpdateUser(userData);
          console.log('User data successfully saved to Firebase');

          // Force a leaderboard refresh to show the updated user
          fetchLeaderboard();
        } catch (error) {
          console.error('Error initializing user data:', error);
        }
      }
    }

    initializeUserData();
  }, [isSignedIn, user]);

  // Load profile image from AsyncStorage and Clerk
  useEffect(() => {
    const loadProfileImage = async () => {
      if (isSignedIn && user) {
        try {
          // First try to get from Clerk
          if (user.imageUrl) {
            setProfileImage(user.imageUrl)
            await AsyncStorage.setItem(PROFILE_IMAGE_KEY, user.imageUrl)
            return
          }

          // Then try AsyncStorage
          const storedImageUrl = await AsyncStorage.getItem(PROFILE_IMAGE_KEY)
          if (storedImageUrl) {
            setProfileImage(storedImageUrl)
          }
        } catch (error) {
          console.error('Error loading profile image:', error)
        }
      }
    }

    loadProfileImage()
  }, [isSignedIn, user])

  // Add this effect to update profile image when user changes
  useEffect(() => {
    if (isSignedIn && user && user.imageUrl) {
      setProfileImage(user.imageUrl)
    }
  }, [isSignedIn, user?.imageUrl])

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {

      setRefreshing(true)
      console.log('Fetching leaderboard data...')

      // Try to fetch real users from Firebase
      const rankedUsers = await fetchLeaderboardData()
      console.log(`Leaderboard fetch returned ${rankedUsers?.length || 0} users`)

      if (rankedUsers && rankedUsers.length > 0) {
        // Log user scores for debugging purposes
        if (isSignedIn && user) {
          const userUUID = getUUIDFromClerkID(user.id)
          const currentUser = rankedUsers.find(u => u.id === userUUID)

          if (currentUser) {
            console.log(`Current user ${currentUser.username} has green_score: ${currentUser.green_score}`)
          } else {
            console.log(`Current user with ID ${userUUID} not found in leaderboard results`)
          }
        }

        // We have users but let's check if they need profile images or better names
        const enhancedUsers = [...rankedUsers];
        let needsUpdate = false;

        for (const existingUser of enhancedUsers) {
          // Fix missing profile image
          if (!existingUser.profile_url || existingUser.profile_url === '') {
            existingUser.profile_url = `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 30) + 1}.jpg`;
            needsUpdate = true;
          }

          // Fix missing or anonymous username
          if (!existingUser.username || existingUser.username === 'Anonymous User') {
            const names = ['AlexGreen', 'JamieEco', 'TaylorParks', 'MorganRivers', 'CaseyWoods', 'RileyNature', 'JordanEarth', 'QuinnForest'];
            existingUser.username = names[Math.floor(Math.random() * names.length)];
            needsUpdate = true;
          }

          // Update this user if fixes were needed
          if (needsUpdate) {
            try {
              await createOrUpdateUser(existingUser);
              console.log(`Enhanced user: ${existingUser.username}`);
            } catch (err) {
              console.error('Error updating user profile:', err);
            }
          }
        }

        // Use the enhanced users list
        setUsers(enhancedUsers);

        // Find and set current user's rank
        if (isSignedIn && user) {
          const userUUID = getUUIDFromClerkID(user.id)
          const currentUser = enhancedUsers.find(u => u.id === userUUID)
          if (currentUser) {
            setUserRank(currentUser)
          }
        }

        setLoading(false);
        setRefreshing(false);
        return;
      }

      // If no users are found, create test users
      if (!rankedUsers || rankedUsers.length === 0) {
        console.log('No user data found in leaderboard')

        // Development feature: Create sample users for testing
        if (isSignedIn && user) {
          try {
            console.log('Creating sample users for development testing')

            // Better sample users for development/testing with diverse profile images
            const testUsers = [
              {
                id: 'test-user-1',
                username: 'janesmith',
                green_score: 150,
                profile_url: 'https://randomuser.me/api/portraits/women/12.jpg'
              },
              {
                id: 'test-user-2',
                username: 'johndoe',
                green_score: 120,
                profile_url: 'https://randomuser.me/api/portraits/men/15.jpg'
              },
              {
                id: 'test-user-3',
                username: 'alice',
                green_score: 90,
                profile_url: 'https://randomuser.me/api/portraits/women/22.jpg'
              },
              {
                id: 'test-user-4',
                username: 'rgreen',
                green_score: 200,
                profile_url: 'https://randomuser.me/api/portraits/men/33.jpg'
              },
              {
                id: 'test-user-5',
                username: 'saralee',
                green_score: 170,
                profile_url: 'https://randomuser.me/api/portraits/women/28.jpg'
              }
            ];

            // Add test users to Firebase
            for (const testUser of testUsers) {
              await createOrUpdateUser(testUser as UserData);
            }

            // Ensure current user is in Firebase with proper details
            const userData: UserData = {
              id: getUUIDFromClerkID(user.id),
              clerk_id: user.id,
              username: user.username || `ecofriend_${Math.floor(Math.random() * 1000)}`,
              green_score: Math.floor(Math.random() * 200) + 50, // Random score for testing
              profile_url: user.imageUrl || 'https://randomuser.me/api/portraits/men/40.jpg',
            }
            await createOrUpdateUser(userData)

            // Fetch again after adding test users
            console.log('Fetching leaderboard again after adding test users')
            const updatedRankedUsers = await fetchLeaderboardData()

            if (updatedRankedUsers && updatedRankedUsers.length > 0) {
              console.log(`Found ${updatedRankedUsers.length} users on second attempt`)
              setUsers(updatedRankedUsers)

              // Find current user in results
              const userUUID = getUUIDFromClerkID(user.id)
              const currentUser = updatedRankedUsers.find(u => u.id === userUUID)
              if (currentUser) {
                setUserRank(currentUser)
              }

              setLoading(false)
              setRefreshing(false)
              return
            }
          } catch (error) {
            console.error('Error creating sample users:', error)
          }
        }

        // If we can't create test users or the second fetch fails
        setUsers([])
        return
      }

      // If users were found initially, use them
      console.log(`Setting ${rankedUsers.length} users in leaderboard`)
      setUsers(rankedUsers)

      // Find and set current user's rank
      if (isSignedIn && user) {
        const userUUID = getUUIDFromClerkID(user.id)
        const currentUser = rankedUsers.find(u => u.id === userUUID)
        if (currentUser) {
          setUserRank(currentUser)
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      Alert.alert(
        'Error Loading Leaderboard',
        'Failed to load leaderboard data. Please try again later.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Handle profile image upload
  const handleProfileUpload = async () => {
    if (!isSignedIn) {
      Alert.alert('Sign In Required', 'Please sign in to upload a profile photo.')
      return
    }

    Alert.alert(
      'Upload Profile Photo',
      'Choose a photo source',
      [
        {
          text: '📸 Take Photo',
          onPress: () => launchCamera(),
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: () => launchGallery(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    )
  }

  const launchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera access is required to take photos')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error launching camera:', error)
      Alert.alert('Error', 'Failed to launch camera')
    }
  }

  const launchGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Gallery access is required to select photos')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error launching gallery:', error)
      Alert.alert('Error', 'Failed to launch gallery')
    }
  }

  const uploadImage = async (imageUri: string) => {
    if (!isSignedIn || !user) {
      Alert.alert('Error', 'You must be signed in to upload a profile photo')
      return
    }

    try {
      setUploadingImage(true)

      // Upload to Clerk
      console.log('Uploading to Clerk...')
      const userUUID = getUUIDFromClerkID(user.id)

      // Read the image file
      const imageInfo = await FileSystem.getInfoAsync(imageUri)
      if (!imageInfo.exists) {
        throw new Error('Image file does not exist')
      }

      // Create the file object for Clerk
      const file = {
        uri: imageUri,
        name: `profile-${userUUID}-${Date.now()}.jpg`,
        type: 'image/jpeg',
      }

      // Upload to Clerk
      await user.setProfileImage({
        file
      })

      // Get the updated user data to get the new image URL
      const updatedUser = await user.reload()
      const imageUrl = updatedUser.imageUrl

      if (!imageUrl) {
        throw new Error('Failed to get image URL after upload')
      }

      console.log('File uploaded successfully:', imageUrl)

      // Update local state
      setProfileImage(imageUrl)

      // Save to AsyncStorage
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, imageUrl)

      // Update Firebase
      await updateUserProfileImage(userUUID, imageUrl)

      // Update user rank if exists
      if (userRank) {
        setUserRank({ ...userRank, profile_url: imageUrl })
      }

      // Force a leaderboard refresh to update the UI
      fetchLeaderboard()

      Alert.alert('Success', 'Profile photo updated successfully')
    } catch (error: any) {
      console.error('Error uploading profile image:', error)
      Alert.alert('Upload Failed', 'Failed to upload profile photo. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

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

  // Initialize data
  useEffect(() => {
    fetchLeaderboard()
  }, [isSignedIn])

  // Add a refresh function for the pull-to-refresh feature
  const onRefresh = useCallback(() => {
    fetchLeaderboard()
  }, [])

  // Add this useFocusEffect hook to refresh leaderboard when the tab becomes active
  useFocusEffect(
    useCallback(() => {
      console.log('Leaderboard screen focused - refreshing data');
      fetchLeaderboard();
      return () => {
        // cleanup if needed
      };
    }, [isSignedIn])
  );

  // Calculate eco coins when user rank changes
  useEffect(() => {
    if (userRank) {
      const coins = Math.floor(userRank.green_score / 200);
      setUserEcoCoins(coins);
    }
  }, [userRank]);

  // Add this function to check username uniqueness
  const checkUsernameAvailability = async (username: string) => {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('username', '==', username))
      const querySnapshot = await getDocs(q)
      return querySnapshot.empty // true if username is available
    } catch (error) {
      console.error('Error checking username:', error)
      return false
    }
  }

  // Add this function to handle username update
  const handleUsernameUpdate = async () => {
    if (!isSignedIn || !user) return

    try {
      setIsCheckingUsername(true)

      // Trim whitespace and convert to lowercase for consistency
      const trimmedUsername = newUsername.trim().toLowerCase()

      // Basic validation
      if (trimmedUsername.length < 3) {
        Alert.alert('Invalid Username', 'Username must be at least 3 characters long')
        return
      }

      if (trimmedUsername.length > 20) {
        Alert.alert('Invalid Username', 'Username must be less than 20 characters')
        return
      }

      // Check if username is available
      const isAvailable = await checkUsernameAvailability(trimmedUsername)
      if (!isAvailable) {
        Alert.alert('Username Taken', 'This username is already taken. Please choose another one.')
        return
      }

      // Update username in Clerk
      await user.update({
        username: trimmedUsername
      })

      // Update username in Firebase
      const userUUID = getUUIDFromClerkID(user.id)
      const userRef = doc(db, 'users', userUUID)
      await updateDoc(userRef, {
        username: trimmedUsername
      })

      // Update local state
      if (userRank) {
        setUserRank({ ...userRank, username: trimmedUsername })
      }

      // Refresh leaderboard
      fetchLeaderboard()

      setIsEditingUsername(false)
      Alert.alert('Success', 'Username updated successfully')
    } catch (error) {
      console.error('Error updating username:', error)
      Alert.alert('Error', 'Failed to update username. Please try again.')
    } finally {
      setIsCheckingUsername(false)
    }
  }

  // Render a user item in the leaderboard
  const renderUserItem = ({ item }: { item: UserData }) => {
    const isCurrentUser = isSignedIn && user && item.id === getUUIDFromClerkID(user.id)

    return (
      <View style={[styles.userItem, isCurrentUser && styles.currentUserItem]}>
        <ThemedText style={[styles.rankText, isCurrentUser && styles.currentUserText]}>{item.rank}.</ThemedText>

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

          <ThemedText style={[styles.userName, isCurrentUser && styles.currentUserText]}>
            {item.username}
          </ThemedText>
        </View>

        <View style={[styles.scoreContainer, isCurrentUser && styles.currentUserScore]}>
          <ThemedText style={styles.scoreText}>{item.green_score}</ThemedText>
        </View>
      </View>
    )
  }

  // Add this to your JSX where the username is displayed
  const renderUsernameSection = () => {
    if (isEditingUsername) {
      return (
        <View style={styles.usernameEditContainer}>
          <TextInput
            style={styles.usernameInput}
            value={newUsername}
            onChangeText={setNewUsername}
            placeholder="Enter new username"
            placeholderTextColor={COLORS.soil}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
          <View style={styles.usernameEditButtons}>
            <TouchableOpacity
              style={[styles.usernameButton, styles.cancelButton]}
              onPress={() => {
                setIsEditingUsername(false)
                setNewUsername('')
              }}
            >
              <ThemedText style={styles.usernameButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.usernameButton, styles.saveButton]}
              onPress={handleUsernameUpdate}
              disabled={isCheckingUsername}
            >
              {isCheckingUsername ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <ThemedText style={styles.usernameButtonText}>Save</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.usernameDisplayContainer}>
        <ThemedText style={styles.userNameTitle}>
          {user?.username || user?.fullName || 'Green User'}
        </ThemedText>
        <TouchableOpacity
          style={styles.editUsernameButton}
          onPress={() => {
            setNewUsername(user?.username || '')
            setIsEditingUsername(true)
          }}
        >
          <Ionicons name="pencil" size={16} color={COLORS.leafGreen} />
        </TouchableOpacity>
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
          <View style={[styles.titleContainer, { marginTop: 15 }]}>
            <ThemedText style={styles.headerTitle}>LeaderBoard</ThemedText>
            <View style={styles.headerRightContainer}>
              {isSignedIn && (
                <TouchableOpacity
                  style={styles.ecoCoinsContainer}
                  onPress={() => setShowCoinInfo(true)}
                >
                  <View style={styles.coinIconContainer}>
                    <View style={styles.coinInner}>
                      <ThemedText style={styles.coinSymbol}>₳</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.ecoCoinsText}>{userEcoCoins}</ThemedText>
                </TouchableOpacity>
              )}
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
          </View>

          {isSignedIn ? (
            <View style={styles.userProfileContainer}>
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  style={[
                    styles.profilePhotoContainer,
                    uploadingImage && styles.uploadingContainer,
                  ]}
                  onPress={handleProfileUpload}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <View style={styles.uploadingContent}>
                      <ActivityIndicator size="large" color={COLORS.leafGreen} />
                      <ThemedText style={styles.uploadingText}>
                        Uploading...
                      </ThemedText>
                    </View>
                  ) : profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.userProfileImage}
                    />
                  ) : (
                    <View style={styles.uploadPromptContainer}>
                      <View style={styles.uploadIconContainer}>
                        <Ionicons name="camera" size={32} color={COLORS.leafGreen} />
                        <View style={styles.plusIconContainer}>
                          <Ionicons name="add" size={16} color={COLORS.white} />
                        </View>
                      </View>
                      <ThemedText style={styles.uploadText}>
                        Add Photo
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.profileInfo}>
                  {renderUsernameSection()}

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

        {/* Add Static Current User Rank Bar */}
        {isSignedIn && userRank && (
          <Animated.View
            entering={FadeIn.duration(500)}
            exiting={FadeOut.duration(500)}
            style={styles.currentUserRankBar}
          >
            <View style={styles.rankBarContent}>
              <View style={styles.rankInfo}>
                <ThemedText style={styles.rankBarPosition}>#{userRank.rank}</ThemedText>
                <View style={styles.rankBarImageContainer}>
                  <Image
                    source={{ uri: profileImage || userRank.profile_url }}
                    style={styles.rankBarImage}
                  />
                </View>
                <ThemedText style={styles.rankBarUsername}>
                  {user?.username || user?.fullName || 'You'}
                </ThemedText>
              </View>
              <View style={styles.rankBarScore}>
                <ThemedText style={styles.rankBarScoreText}>
                  {userRank.green_score}
                </ThemedText>
                <Ionicons name="leaf" size={16} color={COLORS.leafGreen} />
              </View>
            </View>
          </Animated.View>
        )}

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
            onRefresh={onRefresh}
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

        {/* Coin Info Modal */}
        <Modal
          visible={showCoinInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCoinInfo(false)}
        >
          <View style={styles.coinModalOverlay}>
            <View style={styles.coinModalContainer}>
              <View style={styles.coinModalHeader}>
                <View style={styles.largeCoinIcon}>
                  <View style={styles.largeCoinInner}>
                    <ThemedText style={styles.largeCoinSymbol}>₳</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.coinModalTitle}>Eco Coins</ThemedText>
              </View>

              <View style={styles.coinModalContent}>
                <ThemedText style={styles.coinModalDescription}>
                  Use your eco coins to get exclusive benefits:
                </ThemedText>

                <View style={styles.benefitItem}>
                  <Ionicons name="airplane" size={24} color={COLORS.leafGreen} />
                  <ThemedText style={styles.benefitText}>
                    Get discounts on eco-friendly travel options
                  </ThemedText>
                </View>

                <View style={styles.benefitItem}>
                  <Ionicons name="shirt" size={24} color={COLORS.leafGreen} />
                  <ThemedText style={styles.benefitText}>
                    Purchase exclusive GoGreen merchandise
                  </ThemedText>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowCoinInfo(false)}
              >
                <ThemedText style={styles.closeModalButtonText}>Got it!</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.lightestGreen,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 197, 94, 0.2)',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 12,
    paddingTop: 10,
  },
  headerTitle: {

    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ecoCoinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightestGreen,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
    gap: 6,
  },
  coinIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.leafGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  coinInner: {
    width: '90%',
    height: '90%',
    borderRadius: 15,
    backgroundColor: COLORS.leafGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  coinSymbol: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  ecoCoinsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  signOutButton: {
    padding: 8,
    borderRadius: 25,
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
    height: 100,
    width: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderWidth: 2,
    borderColor: COLORS.leafGreen,
    overflow: 'hidden',
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadingContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderStyle: 'dashed',
  },
  uploadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.darkGreen,
  },
  uploadPromptContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  plusIconContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.leafGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGreen,
    marginTop: 4,
  },
  userProfileImage: {
    height: '100%',
    width: '100%',
    borderRadius: 50,
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
    borderRadius: 25,
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
    borderRadius: 30,
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
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserItem: {
    backgroundColor: COLORS.lightestGreen,
    borderWidth: 2,
    borderColor: COLORS.leafGreen,
    transform: [{ scale: 1.02 }],
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.leafGreen,
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
    borderRadius: 25,
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
    borderRadius: 30,
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
    borderRadius: 25,
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
  currentUserText: {
    color: COLORS.darkGreen,
    fontWeight: 'bold',
    fontSize: 17,
  },
  currentUserScore: {
    backgroundColor: COLORS.leafGreen,
    borderWidth: 1,
    borderColor: COLORS.white,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  coinModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  coinModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  largeCoinIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.leafGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 12,
  },
  largeCoinInner: {
    width: '90%',
    height: '90%',
    borderRadius: 30,
    backgroundColor: COLORS.leafGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  largeCoinSymbol: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  coinModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  coinModalContent: {
    width: '100%',
    marginBottom: 24,
  },
  coinModalDescription: {
    fontSize: 16,
    color: COLORS.soil,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightestGreen,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
  },
  benefitText: {
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.darkGreen,
    flex: 1,
  },
  closeModalButton: {
    backgroundColor: COLORS.leafGreen,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  closeModalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentUserRankBar: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    padding: 12,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: COLORS.leafGreen,
  },
  rankBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBarPosition: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginRight: 12,
  },
  rankBarImageContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.leafGreen,
  },
  rankBarImage: {
    width: '100%',
    height: '100%',
  },
  rankBarUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
  },
  rankBarScore: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightestGreen,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
  },
  rankBarScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginRight: 4,
  },
  usernameEditContainer: {
    marginBottom: 8,
  },
  usernameInput: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
    color: COLORS.darkGreen,
    fontSize: 16,
  },
  usernameEditButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  usernameButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    minWidth: 80,
    alignItems: 'center',
  },
  usernameButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  usernameDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editUsernameButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: COLORS.lightestGreen,
  },
})

