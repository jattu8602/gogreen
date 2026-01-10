
// OpenAIService.ts
// Handles interactions with OpenAI API for travel planning

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Define types (matching existing TravelPlan structure for compatibility)
export type TravelPlan = {
  city: string;
  duration: string;
  budget: string;
  travelers: string;
  ecoFriendlyTips: string[];
  itinerary: {
    day: number;
    dailyTotal: string;
    activities: {
      time: string;
      activity: string;
      ecoFriendly: boolean;
      cost: string;
      type: string;
      transportInfo?: {
        mode: string;
        duration: string;
        cost: string;
      };
    }[];
  }[];
  totalCost: string;
  transportationTotal: string;
};

export async function generateTravelPlan(
  city: string,
  duration: number,
  budget: string,
  travelers: string
): Promise<{ text: string; travelPlan?: TravelPlan }> {
  if (!API_KEY) {
    console.error('OpenAI API Key is missing');
    throw new Error('OpenAI API Key is missing. Please check your .env file.');
  }

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
    9. Include local public transport where available
    10. Plan budget according to the budget. Person who is spending more recommend luxury and person who is spending less recommend budget places.

    Format the response MUST be a VALID JSON object with the following structure:
    {
      "city": "${city}",
      "duration": "${duration} days",
      "budget": "${budget}",
      "travelers": "${travelers}",
      "ecoFriendlyTips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
      "itinerary": [
        {
          "day": 1,
          "dailyTotal": "total cost for the day",
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
          ]
        }
      ],
      "totalCost": "total trip cost",
      "transportationTotal": "total transportation cost"
    }
  `;

  try {
    console.log('Generating travel plan with OpenAI (gpt-4o-mini)...');

    // Using fetch directly to avoid adding 'openai' package dependency if not needed
    // But adding 'openai' package is safer. Assuming user wants minimal changes, fetch is good.
    // However, direct fetch is robust for simple usage.

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost effective and smart
        messages: [
          { role: 'system', content: 'You are a helpful travel planner assistant. You MUST return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" } // Force JSON mode
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const travelPlan = JSON.parse(content) as TravelPlan;
      return { text: content, travelPlan };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return { text: content };
    }

  } catch (error: any) {
    console.error('Error generating travel plan:', error);
    throw error;
  }
}

// Function to handle general travel planning questions
export async function handleTravelQuestion(question: string): Promise<string> {
  if (!API_KEY) return "OpenAI API Key is missing.";

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an eco-friendly travel planner assistant.' },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch from OpenAI');

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error handling travel question:', error);
    return "I'm sorry, I couldn't process your question at the moment.";
  }
}

export default {
  generateTravelPlan,
  handleTravelQuestion,
};
