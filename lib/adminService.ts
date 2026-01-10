import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { UserData } from './userService'

// Admin-specific user management functions

/**
 * Get all users with pagination
 */
export const getAllUsers = async (
  pageSize: number = 50,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ users: UserData[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    const usersRef = collection(db, 'users')
    let q = query(usersRef, orderBy('createdAt', 'desc'), limit(pageSize))

    if (lastDoc) {
      q = query(usersRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize))
    }

    const querySnapshot = await getDocs(q)
    const users: UserData[] = querySnapshot.docs.map(doc => doc.data() as UserData)
    const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1] || null

    return { users, lastDoc: lastDocument }
  } catch (error) {
    console.error('Error fetching all users:', error)
    return { users: [], lastDoc: null }
  }
}

/**
 * Update user's admin role
 */
export const updateUserRole = async (
  userId: string,
  isAdmin: boolean
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      isAdmin,
    })
    console.log(`Updated user ${userId} admin status to:`, isAdmin)
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

/**
 * Search users by username or email
 */
export const searchUsers = async (searchTerm: string): Promise<UserData[]> => {
  try {
    if (!searchTerm) {
      return []
    }

    const usersRef = collection(db, 'users')
    const q = query(
      usersRef,
      where('username', '>=', searchTerm),
      where('username', '<=', searchTerm + '\uf8ff'),
      limit(20)
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => doc.data() as UserData)
  } catch (error) {
    console.error('Error searching users:', error)
    return []
  }
}

// Activity tracking types
export interface ActivityData {
  id: string
  userId: string
  userName: string
  type: 'route' | 'points' | 'travel_plan' | 'signup'
  timestamp: string
  details: RouteActivity | PointsActivity | TravelPlanActivity | SignupActivity
}

export interface RouteActivity {
  routeId?: string
  distance?: number
  emissions?: number
  mode?: string
  from?: string
  to?: string
}

export interface PointsActivity {
  points: number
  reason: string
  previousScore: number
  newScore: number
}

export interface TravelPlanActivity {
  destination?: string
  mode?: string
  date?: string
  details?: any
}

export interface SignupActivity {
  email?: string
  provider?: string
}

/**
 * Log an activity
 */
export const logActivity = async (
  userId: string,
  userName: string,
  type: ActivityData['type'],
  details: ActivityData['details']
): Promise<void> => {
  try {
    const activitiesRef = collection(db, 'activities')
    const activityId = `${userId}_${Date.now()}_${type}`

    const activity: ActivityData = {
      id: activityId,
      userId,
      userName,
      type,
      timestamp: new Date().toISOString(),
      details,
    }

    await setDoc(doc(activitiesRef, activityId), activity)
    console.log('Activity logged:', activity)
  } catch (error) {
    console.error('Error logging activity:', error)
    // Don't throw - activity logging shouldn't break the app
  }
}

/**
 * Get all activities with pagination
 */
export const getAllActivities = async (
  pageSize: number = 50,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ activities: ActivityData[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    const activitiesRef = collection(db, 'activities')
    let q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(pageSize))

    if (lastDoc) {
      q = query(activitiesRef, orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(pageSize))
    }

    const querySnapshot = await getDocs(q)
    const activities: ActivityData[] = querySnapshot.docs.map(doc => doc.data() as ActivityData)
    const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1] || null

    return { activities, lastDoc: lastDocument }
  } catch (error) {
    console.error('Error fetching activities:', error)
    return { activities: [], lastDoc: null }
  }
}

/**
 * Get activities for a specific user
 */
export const getUserActivities = async (userId: string): Promise<ActivityData[]> => {
  try {
    const activitiesRef = collection(db, 'activities')
    const q = query(
      activitiesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(100)
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => doc.data() as ActivityData)
  } catch (error) {
    console.error('Error fetching user activities:', error)
    return []
  }
}
