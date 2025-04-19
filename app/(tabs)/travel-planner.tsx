// @ts-nocheck
/* eslint-disable */
// This file uses JSX which is handled by the React Native transpiler
// Disabling TypeScript checks to match the other components

import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Linking,
  ImageBackground,
  Text,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import {
  Ionicons,
  MaterialIcons,
  Feather,
  FontAwesome5,
} from '@expo/vector-icons'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import {
  generateTravelPlan,
  findNearbyPlaces,
  TravelPlan,
  NearbyPlace,
} from '../services/geminiService'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Marker, Polyline } from 'react-native-maps'
import { useUser } from '@clerk/clerk-expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { WebView } from 'react-native-webview'
import { TOMTOM_API_KEY } from '../../constants/Config'
import { useNavigation, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

// Define tree-themed colors to match the rest of the app
const COLORS = {
  primary: '#FF7757', // Coral/orange for primary elements
  secondary: '#FFB74D', // Lighter orange
  background: '#FFF8E7', // Warm cream
  cardBackground: '#FFFFFF',
  text: '#2D3748',
  textLight: '#718096',
  inputBorder: 'rgba(0,0,0,0.08)',
  iconBlue: '#63B3ED',
  iconOrange: '#F6AD55',
  iconGreen: '#68D391',
  leafGreen: '#22C55E', // Vibrant leaf green for active items
  darkGreen: '#166534', // Darker green for secondary elements
  bark: '#854D0E', // Brown bark color for accents
  lightBark: '#A16207', // Lighter brown for secondary elements
  soil: '#57534E', // Dark soil color for inactive items
  paleGreen: 'rgba(34, 197, 94, 0.1)', // Transparent green for backgrounds
  white: '#FFFFFF', // White for contrast
  lightestGreen: '#DCFCE7', // Very light green for backgrounds
  orange: '#E86D28', // Orange for highlights and buttons
  darkBackground: '#111111', // Dark background color
  grey: '#CCCCCC', // Grey for inactive elements
  purple: '#7C3AED', // Purple for avatar background
  warmGradientStart: '#FFE5C2', // Warm gradient start color
  warmGradientEnd: '#FFD6A0', // Warm gradient end color
  cream: '#FFF8E7',
  placeholderText: '#9CA3AF',
  labelText: '#374151',
  iconColor: '#6B7280',
}

const WINDOW_WIDTH = Dimensions.get('window').width

// AsyncStorage key for profile image
const PROFILE_IMAGE_KEY = 'user_profile_image'
// AsyncStorage key for saved route data
const SAVED_ROUTE_DATA_KEY = 'SAVED_ROUTE_DATA'

export default function TravelPlannerScreen() {
  const [destination, setDestination] = useState('')
  const [duration, setDuration] = useState('')
  const [budget, setBudget] = useState('')
  const [travellers, setTravellers] = useState('')
  const [loading, setLoading] = useState(false)
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null)

  // Function to handle trip planning
  const handlePlanTrip = async () => {
    if (!destination || !duration || !budget) {
      Alert.alert('Missing Information', 'Please enter destination, duration, and budget.')
      return
    }

    setLoading(true)
    try {
      const result = await generateTravelPlan(
        destination,
        parseInt(duration),
        budget,
        travellers
      )

      if (result.travelPlan) {
        setTravelPlan(result.travelPlan)
      }
    } catch (error) {
      console.error('Error planning trip:', error)
      Alert.alert('Error', 'Failed to plan trip. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#E0F2F7', '#B0E2FF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.header}>
        <Image
          source={require('../../assets/images/trip-planner.png')}
          style={styles.headerBackground}
          resizeMode="cover"
        />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.avatarButton}>
              <Text style={styles.avatarText}>A</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Travel Planner</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.card, styles.planCard]}>
          {/* Where to? */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="location-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.label}>Where to?</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your destination"
              value={destination}
              onChangeText={setDestination}
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          {/* Duration and Budget */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <View style={styles.labelRow}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textLight} />
                <Text style={styles.label}>Duration</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter days"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.halfInput}>
              <View style={styles.labelRow}>
                <Ionicons name="wallet-outline" size={20} color={COLORS.textLight} />
                <Text style={styles.label}>Budget</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>

          {/* Number of Travellers */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="people-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.label}>Number of Travellers</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter number of travellers"
              value={travellers}
              onChangeText={setTravellers}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          {/* Plan Trip Button */}
          <TouchableOpacity
            style={[styles.planButton, loading && styles.planButtonDisabled]}
            onPress={handlePlanTrip}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.planButtonText}>Plan Trip</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Travel Plan Section */}
        {travelPlan && (
          <View style={styles.travelPlanSection}>
            <Text style={styles.sectionTitle}>Your Travel Plan</Text>
            <View style={[styles.card, styles.travelPlanCard]}>
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{travelPlan.city}</Text>
                <View style={styles.planMetadata}>
                  <Text style={styles.planDuration}>{travelPlan.duration}</Text>
                  <Text style={styles.planMetadataDot}>•</Text>
                  <Text style={styles.planTravelers}>{travelPlan.travelers}</Text>
                </View>
              </View>

              <View style={styles.budgetContainer}>
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetLabel}>Budget</Text>
                  <Text style={styles.budgetAmount}>{travelPlan.budget}</Text>
                </View>
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetLabel}>Transport</Text>
                  <Text style={styles.budgetAmount}>{travelPlan.transportationTotal}</Text>
                </View>
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetLabel}>Total Cost</Text>
                  <Text style={[
                    styles.budgetAmount,
                    { color: parseFloat(travelPlan.totalCost.replace(/[^0-9.]/g, '')) >
                            parseFloat(travelPlan.budget.replace(/[^0-9.]/g, '')) ?
                            COLORS.orange : COLORS.leafGreen }
                  ]}>
                    {travelPlan.totalCost}
                  </Text>
                </View>
              </View>

              <View style={styles.itineraryContainer}>
                <Text style={styles.itineraryTitle}>Daily Itinerary</Text>
                {travelPlan.itinerary.map((day) => (
                  <View key={day.day} style={styles.dayContainer}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayTitle}>Day {day.day}</Text>
                      <Text style={styles.dayTotal}>Total: {day.dailyTotal}</Text>
                    </View>
                    {day.activities.map((activity, index) => (
                      <View key={index} style={styles.activityItem}>
                        <View style={styles.activityTimeContainer}>
                          <Text style={styles.activityTime}>{activity.time}</Text>
                        </View>
                        <View style={styles.activityContent}>
                          <View style={styles.activityHeader}>
                            <Text style={styles.activityText}>{activity.activity}</Text>
                            <Text style={styles.activityCost}>{activity.cost}</Text>
                          </View>
                          <View style={styles.activityMeta}>
                            <View style={styles.activityType}>
                              <MaterialCommunityIcons
                                name={getActivityIcon(activity.type)}
                                size={12}
                                color={COLORS.textLight}
                              />
                              <Text style={styles.activityTypeText}>{activity.type}</Text>
                            </View>
                            {activity.ecoFriendly && (
                              <View style={styles.ecoTag}>
                                <Ionicons name="leaf" size={12} color={COLORS.leafGreen} />
                                <Text style={styles.ecoTagText}>Eco-friendly</Text>
                              </View>
                            )}
                          </View>
                          {activity.transportInfo && (
                            <View style={styles.transportInfo}>
                              <View style={styles.transportHeader}>
                                <MaterialCommunityIcons
                                  name={getTransportIcon(activity.transportInfo.mode)}
                                  size={16}
                                  color={COLORS.textLight}
                                />
                                <Text style={styles.transportMode}>{activity.transportInfo.mode}</Text>
                              </View>
                              <View style={styles.transportDetails}>
                                <Text style={styles.transportDuration}>{activity.transportInfo.duration}</Text>
                                <Text style={styles.transportCost}>{activity.transportInfo.cost}</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Eco-Friendly Tips</Text>
              {travelPlan.ecoFriendlyTips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <MaterialCommunityIcons name="leaf-circle-outline" size={20} color={COLORS.leafGreen} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

// Helper function to get activity type icon
function getActivityIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'accommodation':
      return 'bed'
    case 'food':
      return 'food'
    case 'activity':
      return 'walk'
    case 'transport':
      return 'bus'
    default:
      return 'circle-small'
  }
}

// Helper function to get transport icon
function getTransportIcon(mode: string): string {
  switch (mode.toLowerCase()) {
    case 'bus':
      return 'bus'
    case 'train':
      return 'train'
    case 'taxi':
      return 'taxi'
    case 'walk':
      return 'walk'
    case 'bicycle':
      return 'bicycle'
    case 'subway':
      return 'subway'
    default:
      return 'directions'
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 280,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
  },
  titleContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -20 }],
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0077B6',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: -40,
    position: 'relative',
    zIndex: 2,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: 'transparent',
    padding: 24,
    margin: 16,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  planCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  inputGroup: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 0,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfInput: {
    flex: 0.48,
  },
  inputText: {
    fontSize: 16,
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.textLight,
  },
  suggestedPlaces: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  placesList: {
    gap: 12,
  },
  placeCard: {
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    marginBottom: 12,
    padding: 16,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  placeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  placeHeader: {
    marginBottom: 8,
  },
  placeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  placeDistance: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  placeTime: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  placeDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  planButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  planButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  travelPlanSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  travelPlanCard: {
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    marginBottom: 20,
  },
  planHeader: {
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  planMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  planMetadataDot: {
    color: COLORS.textLight,
    marginHorizontal: 8,
  },
  planTravelers: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  budgetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 0,
  },
  budgetInfo: {
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  itineraryContainer: {
    paddingTop: 16,
    borderTopWidth: 0,
  },
  itineraryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activityTimeContainer: {
    width: 60,
    marginRight: 12,
  },
  activityTime: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  ecoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(104, 211, 145, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ecoTagText: {
    fontSize: 12,
    color: COLORS.leafGreen,
    marginLeft: 4,
    fontWeight: '500',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  activityCost: {
    fontSize: 12,
    color: COLORS.textLight,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTotal: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activityTypeText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  tipsContainer: {
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 8,
  },
  tipText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  transportInfo: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 0,
  },
  transportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transportMode: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  transportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 20,
  },
  transportDuration: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  transportCost: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
})
