import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from './firebase'
import { addGreenPoints } from './userService'

// Route history data type
export interface RouteHistory {
  id?: string
  user_id: string
  start_lat: number
  start_lng: number
  end_lat: number
  end_lng: number
  distance: number
  duration: string
  co2_emission: number
  vehicle_type: string
  route_type: string
  green_points: number
  created_at?: Timestamp
}

/**
 * Saves a route to history and adds green points to user
 */
export const saveRoute = async (
  routeData: Omit<RouteHistory, 'id' | 'created_at'>
): Promise<string> => {
  try {
    console.log(
      `Saving route for user ${routeData.user_id} with ${routeData.green_points} points`
    )

    // Validate green points
    if (
      typeof routeData.green_points !== 'number' ||
      isNaN(routeData.green_points)
    ) {
      console.error('Invalid green points value:', routeData.green_points)
      routeData.green_points = 10 // Default to 10 points if invalid
    }

    // Add timestamp
    const routeWithTimestamp = {
      ...routeData,
      created_at: Timestamp.now(),
    }

    // Save to route_history collection
    const docRef = await addDoc(
      collection(db, 'route_history'),
      routeWithTimestamp
    )
    console.log(`Route saved with ID: ${docRef.id}`)

    // Add points to user's score
    console.log(
      `Now adding ${routeData.green_points} green points to user ${routeData.user_id}`
    )
    await addGreenPoints(routeData.user_id, routeData.green_points)

    return docRef.id
  } catch (error) {
    console.error('Error saving route:', error)
    throw error
  }
}

/**
 * Gets route history for a user
 */
export const getUserRouteHistory = async (
  userId: string,
  maxResults: number = 10
): Promise<RouteHistory[]> => {
  try {
    const routesRef = collection(db, 'route_history')
    const q = query(
      routesRef,
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(maxResults)
    )

    const querySnapshot = await getDocs(q)
    const routes: RouteHistory[] = []

    querySnapshot.forEach((doc) => {
      routes.push({
        id: doc.id,
        ...doc.data(),
      } as RouteHistory)
    })

    return routes
  } catch (error) {
    console.error('Error getting user route history:', error)
    throw error
  }
}

/**
 * Calculates green points based on route options
 */
export const calculateGreenPoints = (
  distance: number,
  vehicleType: string,
  routeType: string
): number => {
  // Base emission for comparison (kg per km)
  const baselineEmission = 0.2

  // Actual emission based on vehicle type
  let actualEmission = 0
  switch (vehicleType) {
    case 'car':
      actualEmission = 0.12 // Lower for eco-friendly calculation
      break
    case 'bike':
    case 'cycle':
    case 'walk':
      actualEmission = 0 // Zero emissions
      break
    case 'train':
      actualEmission = 0.04 // Low emissions
      break
    case 'auto':
    case 'taxi':
      actualEmission = 0.15 // Medium emissions
      break
    default:
      actualEmission = 0.1
  }

  // Points multiplier based on route type
  let multiplier = 1
  if (routeType === 'cost-effective') {
    multiplier = 2
  } else if (vehicleType === 'car' && routeType === 'fastest') {
    multiplier = 0.8 // Slightly lower for fast routes in car
  }

  // Calculate points (emissions saved * distance * multiplier)
  let points = Math.round(
    (baselineEmission - actualEmission) * distance * 10 * multiplier
  )

  // Extra points for zero-emission options
  if (['bike', 'cycle', 'walk'].includes(vehicleType)) {
    points += Math.round(distance * 5) // Bonus for exercise
  }

  // Ensure minimum points
  return Math.max(points, 5)
}
