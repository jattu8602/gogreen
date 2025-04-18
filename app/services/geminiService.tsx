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
  ecoFriendlyTips: string[]
  co2Saved: number
  itinerary: {
    day: number
    activities: {
      time: string
      activity: string
      ecoFriendly: boolean
      co2Impact: number
    }[]
  }[]
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
  duration: number
): Promise<{ text: string; travelPlan?: TravelPlan }> {
  try {
    // Create a prompt for the Gemini API
    const prompt = `
      Create an eco-friendly travel plan for ${duration} days in ${city}.
      Include:
      1. A day-by-day itinerary with specific activities and times
      2. Eco-friendly transportation options
      3. Sustainable accommodation recommendations
      4. Local, sustainable food options
      5. Estimated CO2 emissions saved compared to conventional travel
      6. Specific eco-friendly tips for this destination

      Format the response as a JSON object with the following structure:
      {
        "city": "${city}",
        "duration": "${duration} days",
        "ecoFriendlyTips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
        "co2Saved": number (in kg),
        "itinerary": [
          {
            "day": 1,
            "activities": [
              {
                "time": "HH:MM",
                "activity": "description",
                "ecoFriendly": true/false,
                "co2Impact": number (in kg)
              }
            ]
          }
        ]
      }

      Also provide a friendly, conversational summary of the travel plan that highlights the eco-friendly aspects and CO2 savings.
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
  endLocation: string
): Promise<{ text: string; routePlan?: RoutePlan }> {
  try {
    const prompt = `
      Create an eco-friendly route plan from ${startLocation} to ${endLocation}.
      Include:
      1. A detailed route with recommended stops and estimated times
      2. The total distance and duration of the journey
      3. Estimated CO2 emissions for the route
      4. An eco-friendly score on a scale of 1-100

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
        "ecoFriendlyScore": number (1-100)
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
