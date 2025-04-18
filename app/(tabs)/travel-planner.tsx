// @ts-nocheck
/* eslint-disable */
// This file uses JSX which is handled by the React Native transpiler
// Disabling TypeScript checks to match the other components

import * as React from 'react'
const { useState, useRef } = React
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
  Text,
  ImageBackground,
  Image,
  Linking,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { generateTravelPlan, handleTravelQuestion, TravelPlan } from '../services/geminiService'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Define tree-themed colors to match the rest of the app
const COLORS = {
  leafGreen: '#22C55E', // Vibrant leaf green for active items
  darkGreen: '#166534', // Darker green for secondary elements
  bark: '#854D0E', // Brown bark color for accents
  lightBark: '#A16207', // Lighter brown for secondary elements
  soil: '#57534E', // Dark soil color for inactive items
  paleGreen: 'rgba(34, 197, 94, 0.1)', // Transparent green for backgrounds
  white: '#FFFFFF', // White for contrast
  lightestGreen: '#DCFCE7', // Very light green for backgrounds
}

// Define message types
type Message = {
  id: string
  text: string
  sender: 'user' | 'bot' | 'assistant'
  timestamp: Date
}

type NearbyPlace = {
  name: string
  description: string
  imageUrl: string
  distance: string
  ecoFriendly: boolean
  address: string
  googleMapsUrl: string
}

export default function TravelPlannerScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your eco-friendly travel planner. I can help you plan your trip while minimizing your carbon footprint. Please tell me which city you\'d like to explore and how many days you have available.',
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const insets = useSafeAreaInsets()

  // Function to generate a unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9)

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (inputText.trim() === '') return

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      // Check if the message contains city and duration information
      const cityMatch = inputText.match(/in\s+([A-Za-z\s,]+)/i)
      const durationMatch = inputText.match(/(\d+)\s+days?/i)

      let botResponse: { text: string; travelPlan?: TravelPlan }

      if (cityMatch && durationMatch) {
        const city = cityMatch[1].trim()
        const duration = parseInt(durationMatch[1])

        // Generate a travel plan using the Gemini API
        botResponse = await generateTravelPlan(city, duration)

        // Generate nearby places to visit
        if (botResponse.travelPlan) {
          generateNearbyPlaces(city)
        }
      } else if (inputText.toLowerCase().includes('nearby') ||
                inputText.toLowerCase().includes('place') ||
                inputText.toLowerCase().includes('attraction') ||
                inputText.toLowerCase().includes('visit')) {
        // If user is asking about nearby places
        const cityFromPlan = travelPlan?.city || ''
        if (cityFromPlan) {
          generateNearbyPlaces(cityFromPlan)
          botResponse = {
            text: `Here are some interesting eco-friendly places to visit in ${cityFromPlan}. I've included photos and navigation links for your convenience.`
          }
        } else {
          botResponse = {
            text: 'Please first tell me which city you\'d like to explore so I can recommend nearby places to visit.'
          }
        }
      } else {
        // Handle general travel questions
        const response = await handleTravelQuestion(inputText)
        botResponse = { text: response }
      }

      const botMessage: Message = {
        id: generateId(),
        text: botResponse.text,
        sender: 'bot',
        timestamp: new Date(),
      }

      setMessages((prevMessages) => [...prevMessages, botMessage])

      if (botResponse.travelPlan) {
        setTravelPlan(botResponse.travelPlan)
      }
    } catch (error) {
      console.error('Error processing message:', error)

      const errorMessage: Message = {
        id: generateId(),
        text: 'I\'m sorry, I encountered an error while processing your request. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
      }

      setMessages((prevMessages) => [...prevMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Generate nearby places to visit
  const generateNearbyPlaces = (city: string) => {
    // This would normally call an API to get real places
    // For now, we'll use mock data based on the city
    const mockPlaces: NearbyPlace[] = [
      {
        name: `${city} Botanical Gardens`,
        description: `Beautiful botanical gardens showcasing native flora and sustainable gardening practices. The gardens use rainwater harvesting and solar power.`,
        imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        distance: '2.3 km',
        ecoFriendly: true,
        address: `Botanical Gardens, ${city}`,
        googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(`Botanical Gardens ${city}`)}`
      },
      {
        name: `${city} Eco Park`,
        description: `A sustainable urban park with walking trails, organic gardens, and educational displays about conservation and biodiversity.`,
        imageUrl: 'https://images.unsplash.com/photo-1528157538665-47213e7aed7b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        distance: '3.5 km',
        ecoFriendly: true,
        address: `Eco Park, ${city}`,
        googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(`Eco Park ${city}`)}`
      },
      {
        name: `${city} Heritage Museum`,
        description: `Learn about the cultural heritage and history of ${city} at this museum which implements energy-efficient building practices.`,
        imageUrl: 'https://images.unsplash.com/photo-1560343776-97e7d202ff0e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        distance: '1.8 km',
        ecoFriendly: false,
        address: `Heritage Museum, ${city}`,
        googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(`Heritage Museum ${city}`)}`
      },
      {
        name: `${city} Farmers Market`,
        description: `Local farmers market with organic produce, handcrafted goods, and a zero-waste policy. All vendors use compostable packaging.`,
        imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        distance: '2.1 km',
        ecoFriendly: true,
        address: `Farmers Market, Downtown ${city}`,
        googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(`Farmers Market ${city}`)}`
      },
      {
        name: `${city} Green Cafe`,
        description: `An eco-friendly cafe serving organic, locally sourced food and fair-trade coffee. They have a comprehensive recycling program and use renewable energy.`,
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        distance: '1.2 km',
        ecoFriendly: true,
        address: `Green Cafe, Central ${city}`,
        googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(`Green Cafe ${city}`)}`
      }
    ];

    setNearbyPlaces(mockPlaces);
    setShowNearbyPlaces(true);
  }

  // Function to navigate to Google Maps
  const navigateToPlace = (url: string) => {
    Linking.openURL(url).catch(err =>
      Alert.alert('Error', 'Could not open Google Maps')
    );
  }

  // Render a message item
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user'

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.botAvatarContainer}>
            <Ionicons name="leaf" size={20} color={COLORS.leafGreen} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.botMessageBubble,
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.botMessageText,
            ]}
          >
            {item.text}
          </ThemedText>
        </View>
        {isUser && (
          <View style={styles.userAvatarContainer}>
            <Ionicons name="person-circle" size={20} color={COLORS.darkGreen} />
          </View>
        )}
      </View>
    )
  }

  // Render the travel plan
  const renderTravelPlan = () => {
    if (!travelPlan) return null

    return (
      <View style={styles.travelPlanContainer}>
        <View style={styles.travelPlanHeader}>
          <Ionicons name="map" size={24} color={COLORS.white} />
          <ThemedText style={styles.travelPlanTitle}>
            {travelPlan.city} Travel Plan
          </ThemedText>
        </View>

        <View style={styles.ecoStatsContainer}>
          <View style={styles.ecoStatItem}>
            <Ionicons name="leaf-outline" size={24} color={COLORS.leafGreen} />
            <ThemedText style={styles.ecoStatValue}>
              {travelPlan.co2Saved} kg
            </ThemedText>
            <ThemedText style={styles.ecoStatLabel}>CO2 Saved</ThemedText>
          </View>

          <View style={styles.ecoStatItem}>
            <Ionicons name="time-outline" size={24} color={COLORS.leafGreen} />
            <ThemedText style={styles.ecoStatValue}>
              {travelPlan.duration}
            </ThemedText>
            <ThemedText style={styles.ecoStatLabel}>Duration</ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        <ThemedText style={styles.sectionTitle}>
          <Ionicons name="bulb-outline" size={18} color={COLORS.darkGreen} /> Eco-Friendly Tips
        </ThemedText>
        <View style={styles.tipsContainer}>
          {travelPlan.ecoFriendlyTips.map((tip: string, index: number) => (
            <View key={index} style={styles.tipItem}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.leafGreen} />
              </View>
              <ThemedText style={styles.tipText}>{tip}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <ThemedText style={styles.sectionTitle}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.darkGreen} /> Itinerary
        </ThemedText>
        <ScrollView style={styles.itineraryContainer}>
          {travelPlan.itinerary.map((day) => (
            <View key={day.day} style={styles.dayContainer}>
              <View style={styles.dayHeaderContainer}>
                <ThemedText style={styles.dayTitle}>Day {day.day}</ThemedText>
              </View>
              {day.activities.map((activity, index: number) => (
                <View key={index} style={styles.activityContainer}>
                  <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={14} color={COLORS.darkGreen} />
                    <ThemedText style={styles.timeText}>{activity.time}</ThemedText>
                  </View>
                  <View style={styles.activityDetails}>
                    <ThemedText style={styles.activityText}>
                      {activity.activity}
                    </ThemedText>
                    {activity.ecoFriendly && (
                      <View style={styles.ecoBadge}>
                        <Ionicons name="leaf" size={14} color={COLORS.white} />
                        <ThemedText style={styles.ecoBadgeText}>
                          Eco-Friendly
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    )
  }

  // Render nearby places
  const renderNearbyPlaces = () => {
    if (!showNearbyPlaces) return null;

    return (
      <View style={styles.nearbyPlacesContainer}>
        <View style={styles.nearbyPlacesHeader}>
          <Ionicons name="location" size={24} color={COLORS.white} />
          <ThemedText style={styles.nearbyPlacesTitle}>
            Nearby Places to Visit
          </ThemedText>
        </View>

        {nearbyPlaces.map((place, index) => (
          <View key={index} style={styles.placeCard}>
            <Image source={{ uri: place.imageUrl }} style={styles.placeImage} />

            <View style={styles.placeInfo}>
              <View style={styles.placeNameContainer}>
                <ThemedText style={styles.placeName}>{place.name}</ThemedText>
                {place.ecoFriendly && (
                  <View style={styles.ecoFriendlyBadge}>
                    <Ionicons name="leaf" size={12} color={COLORS.white} />
                    <ThemedText style={styles.ecoFriendlyText}>Eco-Friendly</ThemedText>
                  </View>
                )}
              </View>

              <ThemedText style={styles.placeDistance}>
                <Ionicons name="location-outline" size={14} color={COLORS.darkGreen} /> {place.distance}
              </ThemedText>

              <ThemedText style={styles.placeDescription}>
                {place.description}
              </ThemedText>

              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => navigateToPlace(place.googleMapsUrl)}
              >
                <Ionicons name="navigate" size={16} color={COLORS.white} />
                <ThemedText style={styles.navigateButtonText}>Navigate</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/leaf-pattern.png')}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.05 }}
      >
        <StatusBar style="auto" />

        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Travel Planner</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Your eco-friendly travel assistant
          </ThemedText>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListFooterComponent={showNearbyPlaces ? renderNearbyPlaces : renderTravelPlan}
          />

          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Try 'Plan a trip to Paris for 3 days'"
                placeholderTextColor="#888"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              {inputText.trim() !== '' && (
                <TouchableOpacity style={styles.clearButton} onPress={() => setInputText('')}>
                  <Feather name="x" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() === '' ? styles.sendButtonDisabled : null
              ]}
              onPress={handleSendMessage}
              disabled={isLoading || inputText.trim() === ''}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="paper-plane" size={18} color={inputText.trim() ? COLORS.white : '#888'} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom:80,
  },
  backgroundImage: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 197, 94, 0.2)',
    backgroundColor: COLORS.lightestGreen,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.soil,
    marginTop: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  botAvatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userAvatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(22, 101, 52, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '90%',
  },
  userMessageBubble: {
    backgroundColor: COLORS.leafGreen,
    borderBottomRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: COLORS.paleGreen,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: COLORS.white,
  },
  botMessageText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    maxHeight: 100,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 6,
  },
  sendButton: {
    backgroundColor: COLORS.leafGreen,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  travelPlanContainer: {
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  travelPlanHeader: {
    backgroundColor: COLORS.leafGreen,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  travelPlanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 8,
  },
  ecoStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  ecoStatItem: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  ecoStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginVertical: 4,
  },
  ecoStatLabel: {
    fontSize: 12,
    color: COLORS.soil,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 8,
    marginBottom: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.leafGreen,
  },
  tipIconContainer: {
    width: 24,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  itineraryContainer: {
    maxHeight: 300,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dayContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dayHeaderContainer: {
    backgroundColor: COLORS.darkGreen,
    padding: 8,
    paddingHorizontal: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  activityContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 197, 94, 0.1)',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontWeight: '500',
    color: COLORS.darkGreen,
    fontSize: 13,
    marginLeft: 4,
  },
  activityDetails: {
    marginLeft: 18,
  },
  activityText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
  },
  ecoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.leafGreen,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  ecoBadgeText: {
    fontSize: 12,
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: '500',
  },
  nearbyPlacesContainer: {
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nearbyPlacesHeader: {
    backgroundColor: COLORS.leafGreen,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyPlacesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 8,
  },
  placeCard: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 197, 94, 0.2)',
    padding: 16,
    flexDirection: 'row',
  },
  placeImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  placeInfo: {
    flex: 1,
  },
  placeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginRight: 8,
  },
  ecoFriendlyBadge: {
    backgroundColor: COLORS.leafGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ecoFriendlyText: {
    color: COLORS.white,
    fontSize: 10,
    marginLeft: 2,
  },
  placeDistance: {
    fontSize: 14,
    color: COLORS.darkGreen,
    marginBottom: 6,
  },
  placeDescription: {
    fontSize: 14,
    color: COLORS.soil,
    marginBottom: 10,
  },
  navigateButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  navigateButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
})