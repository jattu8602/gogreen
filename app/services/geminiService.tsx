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

// Function to generate a travel plan using Gemini
export async function generateTravelPlan(city: string, duration: number): Promise<{ text: string; travelPlan?: TravelPlan }> {
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
      text: `I'm sorry, I couldn't generate a travel plan for ${city} at the moment. Please try again later.`
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
    return 'I\'m sorry, I couldn\'t process your question at the moment. Please try again later.'
  }
}