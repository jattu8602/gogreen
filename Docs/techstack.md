# GoGreen - Complete Tech Stack Documentation

## 🌱 Project Overview

**GoGreen** is a sophisticated mobile application built with React Native and Expo that promotes environmentally conscious travel decisions. The app combines real-time navigation, AI-powered travel planning, and gamification to encourage users to make sustainable transportation choices while earning green points for their eco-friendly actions.

### 🎯 Core Purpose

- **Environmental Impact**: Reduce carbon footprint through intelligent route recommendations
- **Gamification**: Motivate users through a competitive leaderboard system
- **AI-Powered Planning**: Provide personalized eco-friendly travel itineraries
- **Real-time Navigation**: Offer the most sustainable transportation options based on distance and conditions

---

## 🏗️ Architecture & Technology Stack

### **Frontend Framework**

- **React Native** (v0.76.9) - Cross-platform mobile development
- **Expo** (v52.0.47) - Development platform and build tools
- **TypeScript** (v5.3.3) - Type-safe development
- **Expo Router** (v4.0.21) - File-based routing system

### **Navigation & UI**

- **React Navigation** (v7.0.14) - Navigation library
- **React Native Reanimated** (v3.16.1) - Smooth animations
- **React Native Gesture Handler** (v2.20.2) - Touch interactions
- **React Native Safe Area Context** (v4.12.0) - Safe area handling
- **React Native Screens** (v4.4.0) - Native screen components

### **Maps & Location Services**

- **TomTom Maps SDK** (v6.25.0) - Primary mapping and navigation
- **React Native Maps** (v1.18.0) - Native map components
- **Expo Location** (v18.0.10) - GPS and location services
- **WebView** (v13.12.5) - Embedded web content for maps

### **Authentication & User Management**

- **Clerk** (v2.9.11) - Complete authentication solution
- **Firebase Auth** (v1.10.0) - Alternative authentication backend
- **Expo Secure Store** (v14.0.1) - Secure data storage

### **Backend & Database**

- **Firebase Firestore** (v4.7.10) - Primary NoSQL database
- **Supabase** (v2.49.4) - Alternative PostgreSQL backend
- **Firebase** (v11.6.0) - Complete backend-as-a-service

### **AI & Machine Learning**

- **Google Generative AI** (v0.24.0) - Gemini 2.0 Flash for travel planning
- **Custom AI Services** - Route optimization and eco-friendly recommendations


### **UI Components & Styling**

- **Expo Vector Icons** (v14.0.4) - Icon library
- **Expo Linear Gradient** (v14.0.2) - Gradient backgrounds
- **Expo Blur** (v14.0.3) - Blur effects
- **React Native SVG** (v15.8.0) - SVG support
- **Lottie React Native** (v7.1.0) - Animated graphics

### **State Management & Storage**

- **AsyncStorage** (v1.23.1) - Local data persistence
- **React Hooks** - Component state management
- **Context API** - Global state management

### **Development Tools**

- **Babel** (v7.25.2) - JavaScript compiler
- **Metro** - React Native bundler
- **Jest** (v29.2.1) - Testing framework
- **TypeScript** - Static type checking
- **ESLint** - Code linting

### **Platform Support**

- **iOS** - Native iOS app with tablet support
- **Android** - Native Android app with adaptive icons
- **Web** - Progressive web app support

---

## 🔄 Workflow & Development Process

### **Development Environment Setup**

1. **Expo CLI** - Development server and build tools
2. **TypeScript Configuration** - Strict type checking with path aliases
3. **Environment Variables** - Secure API key management
4. **Hot Reloading** - Real-time development updates

### **Build & Deployment Pipeline**

1. **EAS Build** - Cloud-based builds for iOS and Android
2. **Expo Application Services** - App store deployment
3. **Environment Configuration** - Production vs development settings
4. **Asset Management** - Image optimization and bundling

### **Testing Strategy**

- **Unit Testing** - Jest with React Native testing utilities
- **Component Testing** - Snapshot testing for UI components
- **Integration Testing** - API and service layer testing
- **Manual Testing** - Cross-platform compatibility verification

---

## 🎨 Design System & UI/UX

### **Color Palette**

```typescript
const COLORS = {
  // Primary Colors
  primary: '#FF7757', // Coral/orange for primary elements
  secondary: '#FFB74D', // Lighter orange
  leafGreen: '#22C55E', // Vibrant leaf green for active items
  darkGreen: '#166534', // Darker green for secondary elements

  // Background Colors
  background: '#FFF8E7', // Warm cream background
  cardBackground: '#FFFFFF', // White card backgrounds
  darkBackground: '#111111', // Dark mode background

  // Accent Colors
  bark: '#854D0E', // Brown bark color for accents
  lightBark: '#A16207', // Lighter brown for secondary elements
  soil: '#57534E', // Dark soil color for inactive items

  // Utility Colors
  paleGreen: 'rgba(34, 197, 94, 0.1)', // Transparent green for backgrounds
  lightestGreen: '#DCFCE7', // Very light green for backgrounds
  orange: '#E86D28', // Orange for highlights and buttons
  grey: '#CCCCCC', // Grey for inactive elements
  purple: '#7C3AED', // Purple for avatar background
}
```

### **Typography & Spacing**

- **Consistent Font Sizes** - Scalable typography system
- **Responsive Design** - Adaptive layouts for different screen sizes
- **Accessibility** - High contrast ratios and readable fonts
- **Platform-Specific** - Native look and feel for iOS and Android

### **Component Library**

- **Themed Components** - Consistent styling across the app
- **Reusable UI Elements** - Buttons, inputs, modals, cards
- **Custom Icons** - Eco-themed iconography
- **Animation System** - Smooth transitions and micro-interactions

---

## 🚀 Core Features & Implementation

### **1. Green Navigation System**

- **Intelligent Routing**: TomTom API integration for eco-friendly route calculation
- **Vehicle Recommendations**: Distance-based transportation suggestions
- **CO2 Emission Tracking**: Real-time carbon footprint calculation
- **Green Points System**: Gamified rewards for sustainable choices

### **2. AI-Powered Travel Planner**

- **Gemini 2.0 Flash Integration**: Advanced AI for personalized itineraries
- **Eco-Friendly Recommendations**: Sustainable accommodation and activities
- **Budget Optimization**: Cost-effective travel planning
- **Local Insights**: Destination-specific sustainability tips

### **3. Social Gamification**

- **Leaderboard System**: Competitive ranking based on green scores
- **Achievement Tracking**: Milestone-based rewards
- **Profile Management**: User customization and statistics
- **Community Features**: Social sharing and challenges

### **4. Real-Time Features**

- **Location Services**: GPS integration for accurate positioning
- **Live Updates**: Real-time route optimization
- **Offline Support**: Cached data for offline functionality
- **Push Notifications**: Eco-friendly travel reminders

---

## 🔧 Technical Implementation Details

### **API Integrations**

```typescript
// TomTom Maps API
const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY

// Google Gemini AI
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
}
```

### **Database Schema**

```typescript
// User Data Structure
interface UserData {
  id: string
  clerk_id: string
  username: string
  green_score: number
  profile_url: string
  created_at: Timestamp
}

// Route History Structure
interface RouteHistory {
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
```

### **Green Points Algorithm**

```typescript
const calculateGreenPoints = (
  distance: number,
  vehicleType: string,
  routeType: string
): number => {
  // Base emission comparison
  const baselineEmission = 0.2

  // Vehicle-specific emissions
  const emissions = {
    walk: 0,
    cycle: 0,
    bike: 0,
    train: 0.04,
    bus: 0.05,
    car: 0.12,
    taxi: 0.15,
    auto: 0.15,
  }

  // Calculate points based on emissions saved
  const points = Math.round(
    (baselineEmission - emissions[vehicleType]) * distance * 10
  )

  return Math.max(points, 5) // Minimum 5 points
}
```

---

## 📱 Platform-Specific Features

### **iOS Features**

- **Native iOS Components** - Platform-specific UI elements
- **Tablet Support** - Adaptive layouts for iPad
- **iOS Permissions** - Location and camera access
- **App Store Optimization** - Metadata and screenshots

### **Android Features**

- **Adaptive Icons** - Material Design icon system
- **Android Permissions** - Runtime permission handling
- **Back Button Support** - Native navigation patterns
- **Google Play Store** - Distribution and updates

### **Web Features**

- **Progressive Web App** - Installable web application
- **Responsive Design** - Desktop and mobile web support
- **Service Workers** - Offline functionality
- **Web APIs** - Geolocation and device features

---

## 🔒 Security & Privacy

### **Data Protection**

- **Environment Variables** - Secure API key storage
- **Firebase Security Rules** - Database access control
- **Clerk Authentication** - Secure user management
- **Expo Secure Store** - Encrypted local storage

### **Privacy Compliance**

- **GDPR Compliance** - European data protection
- **Location Privacy** - User consent for GPS access
- **Data Minimization** - Only necessary data collection
- **Transparent Policies** - Clear privacy information

---

## 🚀 Performance Optimization

### **App Performance**

- **Lazy Loading** - On-demand component loading
- **Image Optimization** - Compressed assets and caching
- **Memory Management** - Efficient state handling
- **Bundle Optimization** - Reduced app size

### **Network Optimization**

- **API Caching** - Reduced server requests
- **Offline Support** - Local data persistence
- **Progressive Loading** - Incremental data fetching
- **Error Handling** - Graceful failure recovery

---

## 🔮 Future Roadmap

### **Planned Features**

- **Carbon Offset Integration** - Direct offset purchasing
- **Public Transport APIs** - Real-time transit data
- **Electric Vehicle Charging** - Charging station integration
- **Community Challenges** - Group sustainability goals
- **Advanced Analytics** - Detailed environmental impact reports

### **Technical Enhancements**

- **Machine Learning** - Predictive route optimization
- **Blockchain Integration** - Decentralized green points
- **IoT Integration** - Smart device connectivity
- **AR Navigation** - Augmented reality directions

---

## 📊 Project Statistics

- **Lines of Code**: 15,000+ (TypeScript/React Native)
- **Components**: 50+ reusable UI components
- **API Integrations**: 5+ external services
- **Platform Support**: iOS, Android, Web
- **Development Time**: 6+ months
- **Team Size**: 1-3 developers

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run tests
npm test

# Lint code
npm run lint

# Build for production
eas build
```

---

_This documentation represents the complete technical architecture and implementation details of the GoGreen eco-friendly travel application. The project demonstrates modern mobile development practices with a focus on sustainability and user engagement._
