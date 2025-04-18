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
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '@supabase/supabase-js'
import { useUser } from '@clerk/clerk-expo'
import * as ImagePicker from 'expo-image-picker'
import { v5 as uuidv5 } from 'uuid'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)

// Function to convert Clerk user ID to a consistent UUID
const getUUIDFromClerkID = (clerkId: string): string => {
  // Use UUID v5 with a fixed namespace to generate consistent UUIDs
  // This ensures the same Clerk ID always maps to the same UUID
  const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8' // UUID namespace
  return uuidv5(clerkId, NAMESPACE)
}

// Define user type with CO2 score
type UserData = {
  id: string
  clerk_id?: string
  full_name: string
  username: string
  profile_url?: string
  green_score: number
  rank?: number
}

export default function LeaderboardScreen() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userRank, setUserRank] = useState<UserData | null>(null)
  const { user, isSignedIn } = useUser()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Fetch leaderboard data and current user's rank
  const fetchLeaderboard = async () => {
    try {
      setRefreshing(true)

      // Get leaderboard data
      const { data, error } = await supabase
        .from('users')
        .select('id, clerk_id, full_name, username, profile_url, green_score')
        .order('green_score', { ascending: false })

      if (error) throw error

      // Add rank to each user
      const rankedUsers = data.map((user, index) => ({
        ...user,
        rank: index + 1,
      }))

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
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
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

      // Request permission to access gallery
      const galleryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (galleryPermission.status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please allow access to your gallery to upload photos.'
        )
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0]

        setUploadingImage(true)

        // Convert image to base64 or upload to storage
        // For this example, we'll assume direct Supabase storage upload
        const fileName = `profile-${userUUID}-${Date.now()}`
        const fileExt = selectedImage.uri.split('.').pop()
        const filePath = `${fileName}.${fileExt}`

        // Upload to Supabase
        const response = await fetch(selectedImage.uri)
        const blob = await response.blob()

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, blob)

        if (uploadError) throw uploadError

        // Get public URL
        const { data } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath)

        const publicUrl = data.publicUrl

        // Update user profile in database
        const { error: updateError } = await supabase
          .from('users')
          .update({ profile_url: publicUrl })
          .eq('id', userUUID)

        if (updateError) throw updateError

        setProfileImage(publicUrl)
        fetchLeaderboard() // Refresh data
      }
    } catch (error) {
      console.error('Error uploading profile image:', error)
      Alert.alert(
        'Upload Failed',
        'There was an error uploading your profile image.'
      )
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
                <Ionicons name="person" size={24} color="#666" />
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
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>LeaderBoard</ThemedText>
        {isSignedIn ? (
          <View style={styles.userProfileContainer}>
            <ThemedText style={styles.userNameTitle}>
              {user?.fullName || user?.username}
            </ThemedText>

            <ThemedText style={styles.greenScoreText}>
              Your Green Score is
            </ThemedText>

            <View style={styles.scoreBox}>
              <ThemedText style={styles.userScoreText}>
                {userRank?.green_score || 0}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={handleProfileUpload}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#22C55E" />
              ) : profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.userProfileImage}
                />
              ) : (
                <View style={styles.userProfileImagePlaceholder}>
                  <Ionicons name="camera" size={24} color="#666" />
                  <ThemedText style={styles.uploadText}>Upload</ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.signInButton}>
            <ThemedText style={styles.signInText}>
              Sign In to Track Your Score
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#22C55E" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          style={styles.userList}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={fetchLeaderboard}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              No leaderboard data yet
            </ThemedText>
          }
          ListFooterComponent={
            <ThemedText style={styles.footerText}>
              {users.length > 0 ? `${users.length} more...` : ''}
            </ThemedText>
          }
        />
      )}

      {userRank && (
        <View style={styles.userRankContainer}>
          <ThemedText style={styles.yourRankText}>Your rank is ....</ThemedText>
          <View style={styles.rankInfoBox}>
            <ThemedText style={styles.rankNumber}>{userRank.rank}.</ThemedText>
            <ThemedText style={styles.rankName}>
              {user?.fullName || user?.username}
            </ThemedText>
            <View style={styles.rankScoreCircle}>
              <ThemedText style={styles.rankScoreText}>
                {userRank.green_score}
              </ThemedText>
            </View>
          </View>
        </View>
      )}
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#22C55E',
    textAlign: 'center',
  },
  userProfileContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
    marginBottom: 10,
  },
  userNameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  greenScoreText: {
    fontSize: 16,
    color: '#22C55E',
    marginBottom: 8,
  },
  scoreBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 8,
    marginBottom: 16,
  },
  userScoreText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  userProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userProfileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 12,
    marginTop: 4,
  },
  signInButton: {
    backgroundColor: '#22C55E',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  signInText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    alignItems: 'center',
  },
  currentUserItem: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 2,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  scoreContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  scoreText: {
    fontWeight: 'bold',
    color: '#22C55E',
  },
  userRankContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  yourRankText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  rankInfoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 30,
  },
  rankName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  rankScoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  rankScoreText: {
    fontWeight: 'bold',
    color: '#22C55E',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#22C55E',
  },
})
