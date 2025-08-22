# GoGreen - Eco-Friendly Travel App

GoGreen is a mobile application that helps users plan eco-friendly trips and reduce their carbon footprint while traveling.

## Features

- **Interactive Map**: Select start and end points to find the most eco-friendly route based on traffic conditions.
- **Points of Interest**: Discover eco-friendly tourist spots, hotels, amusement parks, museums, and other interesting places along your route.
- **Travel Planner**: Get personalized eco-friendly travel plans with the help of an AI-powered travel assistant.
- **Leaderboard**: Track your eco-friendly travel achievements and compete with other users.

## Travel Planner

The Travel Planner feature uses Google's Gemini AI to create personalized eco-friendly travel plans. Here's how to use it:

1. Navigate to the "Travel Planner" tab in the app.
2. Tell the AI assistant which city you want to explore and how many days you have available.
3. The assistant will generate a detailed travel plan with:
   - Day-by-day itinerary
   - Eco-friendly transportation options
   - Sustainable accommodation recommendations
   - Local, sustainable food options
   - Estimated CO2 emissions saved compared to conventional travel
   - Specific eco-friendly tips for your destination

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your API keys:
     ```
     EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
     EXPO_PUBLIC_TOMTOM_API_KEY=your_tomtom_api_key
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
     ```
4. Start the development server:
   ```
   npx expo start
   ```

## Technologies Used

- React Native
- Expo
- Google Gemini AI
- TomTom Maps API
- Supabase
- Clerk Authentication

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.



Added small changes by Anuman to test pull request ✅