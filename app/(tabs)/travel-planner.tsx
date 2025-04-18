import React, { useState, useRef } from 'react'
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
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { generateTravelPlan, handleTravelQuestion, TravelPlan } from '../services/geminiService'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Define message types
type Message = {
  id: string
  text: string
  sender: 'user' | 'bot' | 'assistant'
  timestamp: Date
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
      </View>
    )
  }

  // Render the travel plan
  const renderTravelPlan = () => {
    if (!travelPlan) return null

    return (
      <View style={styles.travelPlanContainer}>
        <ThemedText style={styles.travelPlanTitle}>
          Your Eco-Friendly Travel Plan for {travelPlan.city}
        </ThemedText>

        <View style={styles.ecoStatsContainer}>
          <View style={styles.ecoStatItem}>
            <Ionicons name="leaf-outline" size={24} color="#22C55E" />
            <ThemedText style={styles.ecoStatValue}>
              {travelPlan.co2Saved} kg
            </ThemedText>
            <ThemedText style={styles.ecoStatLabel}>CO2 Saved</ThemedText>
          </View>

          <View style={styles.ecoStatItem}>
            <Ionicons name="time-outline" size={24} color="#22C55E" />
            <ThemedText style={styles.ecoStatValue}>
              {travelPlan.duration}
            </ThemedText>
            <ThemedText style={styles.ecoStatLabel}>Duration</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.sectionTitle}>Eco-Friendly Tips</ThemedText>
        <View style={styles.tipsContainer}>
          {travelPlan.ecoFriendlyTips.map((tip: string, index: number) => (
            <View key={index} style={styles.tipItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#22C55E" />
              <ThemedText style={styles.tipText}>{tip}</ThemedText>
            </View>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>Itinerary</ThemedText>
        <ScrollView style={styles.itineraryContainer}>
          {travelPlan.itinerary.map((day) => (
            <View key={day.day} style={styles.dayContainer}>
              <ThemedText style={styles.dayTitle}>Day {day.day}</ThemedText>
              {day.activities.map((activity, index: number) => (
                <View key={index} style={styles.activityContainer}>
                  <View style={styles.timeContainer}>
                    <ThemedText style={styles.timeText}>{activity.time}</ThemedText>
                  </View>
                  <View style={styles.activityDetails}>
                    <ThemedText style={styles.activityText}>
                      {activity.activity}
                    </ThemedText>
                    {activity.ecoFriendly && (
                      <View style={styles.ecoBadge}>
                        <Ionicons name="leaf-outline" size={16} color="#22C55E" />
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

  return (
    <ThemedView style={styles.container}>
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
          ListFooterComponent={renderTravelPlan}
        />

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={isLoading || inputText.trim() === ''}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons name="send" size={24} color={inputText.trim() ? '#22C55E' : '#666'} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 197, 94, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  userMessageBubble: {
    backgroundColor: '#22C55E',
  },
  botMessageBubble: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#22C55E',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  travelPlanContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  travelPlanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 16,
    textAlign: 'center',
  },
  ecoStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  ecoStatItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 12,
    width: '45%',
  },
  ecoStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
    marginVertical: 4,
  },
  ecoStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  tipsContainer: {
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    marginLeft: 8,
    flex: 1,
  },
  itineraryContainer: {
    maxHeight: 300,
  },
  dayContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#22C55E',
  },
  activityContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeContainer: {
    width: 60,
    justifyContent: 'center',
  },
  timeText: {
    fontWeight: '500',
  },
  activityDetails: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
  },
  ecoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ecoBadgeText: {
    fontSize: 12,
    color: '#22C55E',
    marginLeft: 4,
  },
})