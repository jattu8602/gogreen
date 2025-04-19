import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Gemini API with your API key
// In a production app, this should be stored securely in environment variables
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || ''

// Initialize the Gemini model
const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// Define the travel plan type
export type TravelPlan = {
  city: string
  duration: string
  budget: string
  travelers: string
  ecoFriendlyTips: string[]
  itinerary: {
    day: number
    activities: {
      time: string
      activity: string
      ecoFriendly: boolean
      cost: string
      type: string // e.g., 'accommodation', 'food', 'activity', 'transport'
      transportInfo?: {
        mode: string
        duration: string
        cost: string
      }
    }[]
    dailyTotal: string
  }[]
  totalCost: string
  transportationTotal: string
}

// Define route plan type
export type RoutePlan = {
  startLocation: string
  endLocation: string
  stops: {
    time: string
    location: string
    description: string
    isCheckpoint: boolean
  }[]
  distance: string
  duration: string
  co2Emissions: number
  ecoFriendlyScore: number
  // Add coordinates for mapping
  startCoordinates?: {
    latitude: number
    longitude: number
  }
  endCoordinates?: {
    latitude: number
    longitude: number
  }
  // Additional trip details
  estimatedDistance?: string
  estimatedDuration?: string
  travelTips?: string[]
  scenicSpots?: string[]
}

// Define nearby place type
export type NearbyPlace = {
  name: string
  distance: string
  time: string
  description: string
  imageUrl: string
  ecoFriendly: boolean
}

// Function to generate a travel plan using Gemini
export async function generateTravelPlan(
  city: string,
  duration: number,
  budget: string,
  travelers: string
): Promise<{ text: string; travelPlan?: TravelPlan }> {
  try {
    // Create a prompt for the Gemini API
    const prompt = `
      Create a budget-conscious travel plan for ${duration} days in ${city} for ${travelers} traveler(s) with a maximum budget of ${budget}.
      Include:
      1. A day-by-day itinerary with specific activities and times
      2. Activities suitable for the group size (${travelers} people)
      3. Detailed cost breakdown for each activity, staying within ${budget} total
      4. Transportation costs and modes between locations
      5. Mix of free and paid activities
      6. Budget-friendly accommodation options
      7. Affordable local food recommendations
      8. Eco-friendly tips specific to the destination

      Format the response as a JSON object with the following structure:
      {
        "city": "${city}",
        "duration": "${duration} days",
        "budget": "${budget}",
        "travelers": "${travelers}",
        "ecoFriendlyTips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
        "itinerary": [
          {
            "day": 1,
            "activities": [
              {
                "time": "HH:MM",
                "activity": "description",
                "ecoFriendly": true/false,
                "cost": "exact cost",
                "type": "accommodation/food/activity/transport",
                "transportInfo": {
                  "mode": "bus/train/taxi/walk",
                  "duration": "X mins/hours",
                  "cost": "exact cost"
                }
              }
            ],
            "dailyTotal": "total cost for the day"
          }
        ],
        "totalCost": "total trip cost",
        "transportationTotal": "total transportation cost"
      }

      Make sure to:
      1. Keep total costs under the specified budget of ${budget}
      2. Include transportation costs between all locations
      3. Suggest budget-friendly transport options
      4. Include local public transport where available
      5. Account for group size in transport costs
      6. Consider peak/off-peak timing for transport
      7. Include walking for short distances
      8. Add transport duration estimates

      For transportation between locations:
      1. Specify the mode of transport
      2. Include the cost per person/group
      3. Estimate the duration
      4. Prefer eco-friendly options when available
      5. Consider local transport passes or day tickets
      6. Include waiting/buffer time in schedules

      Ensure all costs (activities, accommodation, food, and transport) stay within the specified budget.
    `

    // Generate content using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract the JSON part from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const travelPlan = JSON.parse(jsonMatch[0]) as TravelPlan
        return { text, travelPlan }
      } catch (error) {
        console.error('Error parsing travel plan JSON:', error)
        return { text }
      }
    }

    return { text }
  } catch (error) {
    console.error('Error generating travel plan:', error)
    return {
      text: `I'm sorry, I couldn't generate a travel plan for ${city} at the moment. Please try again later.`,
    }
  }
}

// Function to generate a route plan between two locations
export async function generateRoutePlan(
  startLocation: string,
  endLocation: string,
  filters?: {
    duration?: string
    travellers?: string
    budget?: string
    routeType?: string
  }
): Promise<{ text: string; routePlan?: RoutePlan }> {
  try {
    // Build a more detailed prompt with filters if provided
    let filterText = '';
    if (filters) {
      filterText = `
      Planning preferences:
      - Duration: ${filters.duration || 'Any'}
      - Number of travellers: ${filters.travellers || '1'}
      - Budget: ${filters.budget || 'Medium'}
      - Route type preference: ${filters.routeType || 'Eco-friendly'}

      Please tailor the plan to these preferences.
      `;
    }

    const prompt = `
      Create an eco-friendly route plan from ${startLocation} to ${endLocation}.
      ${filterText}
      Include:
      1. A detailed route with recommended stops and estimated times
      2. The total distance and duration of the journey
      3. Estimated CO2 emissions for the route
      4. An eco-friendly score on a scale of 1-100
      5. Some travel tips specific to this route
      6. Approximate coordinates for start and end locations (use realistic coordinates)

      Format the response as a JSON object with the following structure:
      {
        "startLocation": "${startLocation}",
        "endLocation": "${endLocation}",
        "stops": [
          {
            "time": "HH:MM",
            "location": "location name",
            "description": "brief description",
            "isCheckpoint": true/false
          }
        ],
        "distance": "X km",
        "duration": "X hours Y minutes",
        "co2Emissions": number (in kg),
        "ecoFriendlyScore": number (1-100),
        "startCoordinates": {
          "latitude": number,
          "longitude": number
        },
        "endCoordinates": {
          "latitude": number,
          "longitude": number
        },
        "estimatedDistance": "X km",
        "estimatedDuration": "X hours Y minutes",
        "travelTips": ["tip1", "tip2", "tip3"],
        "scenicSpots": ["spot1", "spot2", "spot3"]
      }

      Also provide a friendly, conversational summary of the route plan that highlights the eco-friendly aspects.
    `

    // Generate content using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract the JSON part from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const routePlan = JSON.parse(jsonMatch[0]) as RoutePlan

        // Use placeholder coordinates for testing if actual coordinates are missing
        if (!routePlan.startCoordinates) {
          // Set default coordinates based on location names
          // These are very approximate and would need to be replaced with actual geocoding
          routePlan.startCoordinates = getApproximateCoordinates(startLocation);
        }

        if (!routePlan.endCoordinates) {
          routePlan.endCoordinates = getApproximateCoordinates(endLocation);
        }

        return { text, routePlan }
      } catch (error) {
        console.error('Error parsing route plan JSON:', error)
        return { text }
      }
    }

    return { text }
  } catch (error) {
    console.error('Error generating route plan:', error)
    return {
      text: `I'm sorry, I couldn't generate a route plan from ${startLocation} to ${endLocation} at the moment. Please try again later.`,
    }
  }
}

// Helper function to get approximate coordinates based on location name
// This is a very simple implementation that would need to be replaced with actual geocoding
function getApproximateCoordinates(location: string): { latitude: number, longitude: number } {
  // Default to coordinates in India
  let latitude = 23.2599; // Default latitude (Bhopal)
  let longitude = 77.4126; // Default longitude (Bhopal)

  // Very basic location matching - this should be replaced with a proper geocoding service
  if (location.toLowerCase().includes('delhi')) {
    latitude = 28.6139;
    longitude = 77.2090;
  } else if (location.toLowerCase().includes('mumbai')) {
    latitude = 19.0760;
    longitude = 72.8777;
  } else if (location.toLowerCase().includes('bangalore') || location.toLowerCase().includes('bengaluru')) {
    latitude = 12.9716;
    longitude = 77.5946;
  } else if (location.toLowerCase().includes('hyderabad')) {
    latitude = 17.3850;
    longitude = 78.4867;
  } else if (location.toLowerCase().includes('chennai')) {
    latitude = 13.0827;
    longitude = 80.2707;
  } else if (location.toLowerCase().includes('kolkata')) {
    latitude = 22.5726;
    longitude = 88.3639;
  } else if (location.toLowerCase().includes('jaipur')) {
    latitude = 26.9124;
    longitude = 75.7873;
  } else if (location.toLowerCase().includes('ahmedabad')) {
    latitude = 23.0225;
    longitude = 72.5714;
  } else if (location.toLowerCase().includes('pune')) {
    latitude = 18.5204;
    longitude = 73.8567;
  } else if (location.toLowerCase().includes('bhopal')) {
    latitude = 23.2599;
    longitude = 77.4126;
  }

  // Add a small random offset to avoid exact same coordinates for different locations
  latitude += (Math.random() - 0.5) * 0.1;
  longitude += (Math.random() - 0.5) * 0.1;

  return { latitude, longitude };
}

// Function to find nearby famous places
export async function findNearbyPlaces(
  location: string,
  radius: number = 50
): Promise<{ text: string; places?: NearbyPlace[] }> {
  try {
    const prompt = `
      Find famous places near ${location} within ${radius} km.
      Include:
      1. Name of the place
      2. Distance from ${location}
      3. Approximate time to reach
      4. Brief description
      5. Whether it's eco-friendly

      Format the response as a JSON array with the following structure:
      [
        {
          "name": "place name",
          "distance": "X km",
          "time": "X hours",
          "description": "brief description",
          "imageUrl": "leave blank, we'll add real images later",
          "ecoFriendly": true/false
        }
      ]

      Provide at least 3-5 famous places, focusing on historical sites, natural attractions, and cultural landmarks.
    `

    // Generate content using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract the JSON part from the response
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/)
    if (jsonMatch) {
      try {
        const places = JSON.parse(jsonMatch[0]) as NearbyPlace[]

        // Add placeholder image URLs (these would be replaced with real images in production)
        const placeholderImages = [
          'https://images.unsplash.com/photo-1558471461-3c04d505fb04',
          'https://images.unsplash.com/photo-1519113127831-aeac99acc42e',
          'https://images.unsplash.com/photo-1570168007204-dfb528c6958f',
          'https://images.unsplash.com/photo-1577132922228-6103a9d62d3d',
          'https://images.unsplash.com/photo-1564288208527-7891d5946c30',
        ]

        // Assign image URLs to places
        places.forEach((place, index) => {
          place.imageUrl = placeholderImages[index % placeholderImages.length]
        })

        return { text, places }
      } catch (error) {
        console.error('Error parsing nearby places JSON:', error)
        return { text }
      }
    }

    return { text }
  } catch (error) {
    console.error('Error finding nearby places:', error)
    return {
      text: `I'm sorry, I couldn't find nearby places for ${location} at the moment. Please try again later.`,
    }
  }
}

// Function to handle general travel planning questions
export async function handleTravelQuestion(question: string): Promise<string> {
  try {
    // Create a prompt for the Gemini API
    const prompt = `
      You are an eco-friendly travel planner assistant. Answer the following question with a focus on sustainable travel practices:

      ${question}

      Provide a helpful, informative response that encourages eco-friendly travel choices.
    `

    // Generate content using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error handling travel question:', error)
    return "I'm sorry, I couldn't process your question at the moment. Please try again later."
  }
}

// Add a default export
export default {
  generateTravelPlan,
  handleTravelQuestion,
  generateRoutePlan,
  findNearbyPlaces,
}
