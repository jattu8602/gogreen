import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  orderBy,
  where,
  increment,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import { v5 as uuidv5 } from 'uuid'

// The namespace used to generate UUIDs
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

// User data type definition
export interface UserData {
  id: string
  clerk_id?: string
  full_name: string
  username: string
  profile_url?: string
  green_score: number
  rank?: number
}

/**
 * Converts a Clerk ID to a consistent UUID
 */
export const getUUIDFromClerkID = (clerkId: string): string => {
  return uuidv5(clerkId, NAMESPACE)
}

/**
 * Gets all users ordered by green score
 */
export const fetchLeaderboard = async (): Promise<UserData[]> => {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, orderBy('green_score', 'desc'))
    const querySnapshot = await getDocs(q)

    const users: UserData[] = []
    const docs = querySnapshot.docs
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i]
      const userData = doc.data() as Omit<UserData, 'rank'>
      users.push({
        ...userData,
        rank: i + 1,
      })
    }

    return users
  } catch (error) {
    console.error('Error fetching leaderboard:', error)

    // Return an empty array instead of throwing an error
    // This allows the app to continue functioning even if there are permission issues
    return []
  }
}

/**
 * Gets a user by their UUID or Clerk ID
 */
export const getUserById = async (
  id: string,
  isClerkId: boolean = false
): Promise<UserData | null> => {
  try {
    let userDoc

    if (isClerkId) {
      // Search by clerk_id field
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('clerk_id', '==', id))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return null
      }

      userDoc = querySnapshot.docs[0]
    } else {
      // Direct lookup by UUID
      const docRef = doc(db, 'users', id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      userDoc = docSnap
    }

    return userDoc.data() as UserData
  } catch (error) {
    console.error('Error getting user:', error)

    // Return null instead of throwing an error
    // This allows the app to continue functioning even if there are permission issues
    return null
  }
}

/**
 * Creates or updates a user
 */
export const createOrUpdateUser = async (
  userData: Partial<UserData> & { id: string; clerk_id?: string }
): Promise<UserData> => {
  try {
    const userRef = doc(db, 'users', userData.id)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      // Update existing user
      await updateDoc(userRef, { ...userData })
      const updatedSnap = await getDoc(userRef)
      return updatedSnap.data() as UserData
    } else {
      // Create new user with default values
      const newUser: UserData = {
        id: userData.id,
        clerk_id: userData.clerk_id || undefined,
        full_name: userData.full_name || '',
        username: userData.username || '',
        profile_url: userData.profile_url || undefined,
        green_score: userData.green_score || 0,
      }

      await setDoc(userRef, newUser)
      return newUser
    }
  } catch (error) {
    console.error('Error creating/updating user:', error)
    throw error
  }
}

/**
 * Updates a user's profile image
 */
export const updateUserProfileImage = async (
  userId: string,
  imageUrl: string
): Promise<void> => {
  try {
    // First try to get the user document to check if it exists
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      console.log('User document does not exist, creating it')
      // Create a new user document if it doesn't exist
      await setDoc(userRef, {
        id: userId,
        profile_url: imageUrl,
        green_score: 0,
        full_name: '',
        username: '',
      })
      return
    }

    // Update the existing user document
    await updateDoc(userRef, {
      profile_url: imageUrl,
    })
  } catch (error) {
    console.error('Error updating profile image:', error)
    throw error
  }
}

/**
 * Adds green points to a user's score
 */
export const addGreenPoints = async (
  userId: string,
  points: number
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      green_score: increment(points),
    })
  } catch (error) {
    console.error('Error adding green points:', error)
    throw error
  }
}
