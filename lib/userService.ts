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
    console.log('Starting fetchLeaderboard function')
    const usersRef = collection(db, 'users')
    const q = query(usersRef, orderBy('green_score', 'desc'))

    console.log('Executing Firestore query...')
    const querySnapshot = await getDocs(q)

    console.log(`Query returned ${querySnapshot.docs.length} documents`)

    const users: UserData[] = []
    const docs = querySnapshot.docs
    for (let i = 0; i < docs.length; i++) {
      const docData = docs[i]
      const userData = docData.data() as Omit<UserData, 'rank'>
      console.log(`Processing user: ${userData.username}`)

      users.push({
        ...userData,
        rank: i + 1,
      })
    }

    console.log(`Returning ${users.length} ranked users`)
    return users
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    // Return an empty array instead of throwing an error
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
      const existingData = userSnap.data() as UserData;

      // Create update object with only the fields that should be updated
      const updateData: Partial<UserData> = {};

      // Only update fields that are provided in userData
      if (userData.clerk_id !== undefined) updateData.clerk_id = userData.clerk_id;
      if (userData.username !== undefined) updateData.username = userData.username;
      if (userData.profile_url !== undefined) updateData.profile_url = userData.profile_url;

      // Important: Only update green_score if explicitly provided with a non-zero value
      // This prevents accidentally resetting the score to 0
      if (userData.green_score !== undefined) {
        // If we're trying to set green_score to 0, only do it if the user is new
        // or if we specifically want to reset the score
        if (userData.green_score !== 0 || existingData.green_score === undefined) {
          updateData.green_score = userData.green_score;
        }
      }

      console.log(`Updating user ${userData.id} with data:`, updateData);

      // Only update if we have fields to update
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userRef, updateData);
      }

      const updatedSnap = await getDoc(userRef)
      return updatedSnap.data() as UserData
    } else {
      // Create new user with default values
      const newUser: UserData = {
        id: userData.id,
        clerk_id: userData.clerk_id || undefined,
        username: userData.username || '',
        profile_url: userData.profile_url || undefined,
        green_score: userData.green_score || 0,
      }

      console.log(`Creating new user ${userData.id} with data:`, newUser);
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
    console.log(`Adding ${points} green points to user ${userId}`);

    // Get the current user data first to verify the current score
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('User document does not exist for ID:', userId);
      throw new Error(`User with ID ${userId} not found`);
    }

    const userData = userSnap.data() as UserData;
    console.log(`Current green score for user ${userId}: ${userData.green_score}`);

    // Update with increment operation
    await updateDoc(userRef, {
      green_score: increment(points),
    });

    console.log(`Added ${points} points. New score should be: ${userData.green_score + points}`);
  } catch (error) {
    console.error('Error adding green points:', error);
    throw error;
  }
}
