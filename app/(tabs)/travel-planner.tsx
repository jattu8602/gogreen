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
  const [travellers, setTravellers] = useState('1')
  const [showTravellersDropdown, setShowTravellersDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const insets = useSafeAreaInsets()

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
        // Also fetch nearby places
        const nearbyResult = await findNearbyPlaces(destination)
        if (nearbyResult.places) {
          setNearbyPlaces(nearbyResult.places)
        }
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

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'transparent']}
          style={[StyleSheet.absoluteFill, styles.headerOverlay]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Travel Planner</Text>
          <TouchableOpacity style={styles.avatarButton}>
            <Text style={styles.avatarText}>A</Text>
          </TouchableOpacity>
      </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Input Card */}
        <View style={styles.card}>
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

          {/* Travellers */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="people-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.label}>Travellers</Text>
            </View>
          <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTravellersDropdown(!showTravellersDropdown)}
            >
              <Text style={[
                styles.inputText,
                !travellers && styles.placeholderText
              ]}>
                {travellers ? `${travellers} Traveller${travellers === '1' ? '' : 's'}` : 'Select number of travellers'}
              </Text>
          </TouchableOpacity>
        </View>

          {/* Plan Trip Button */}
          <TouchableOpacity
            style={styles.planButton}
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
            <View style={styles.travelPlanCard}>
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
          </View>
        )}

        {/* Nearby Places Section - Only shown after travel plan is generated */}
        {nearbyPlaces.length > 0 && (
          <View style={styles.suggestedPlaces}>
            <Text style={styles.sectionTitle}>Nearby Places</Text>
            <View style={styles.placesList}>
              {nearbyPlaces.map((place, index) => (
                <View key={index} style={styles.placeCard}>
                  <View style={[styles.placeIcon, {
                    backgroundColor: place.ecoFriendly ?
                      'rgba(104, 211, 145, 0.1)' : 'rgba(246, 173, 85, 0.1)'
                  }]}>
                    <Ionicons
                      name={place.ecoFriendly ? "leaf" : "location"}
                      size={24}
                      color={place.ecoFriendly ? "#68D391" : "#F6AD55"}
                    />
              </View>
                  <View style={styles.placeInfo}>
                    <View style={styles.placeHeader}>
                      <View style={styles.placeNameContainer}>
                        <Text style={styles.placeName}>{place.name}</Text>
                        <Text style={styles.placeDistance}>{place.distance}</Text>
          </View>
                      <Text style={styles.placeTime}>{place.time}</Text>
        </View>
                    <Text style={styles.placeDescription} numberOfLines={2}>{place.description}</Text>
      </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Travellers Dropdown Overlay */}
      {showTravellersDropdown && (
        <View style={styles.overlay}>
          <View style={styles.dropdownCard}>
            {['1', '2', '3', '4', '5+'].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.dropdownItem,
                  travellers === num && styles.selectedDropdownItem
                ]}
                onPress={() => {
                  setTravellers(num)
                  setShowTravellersDropdown(false)
                }}
              >
                <Text style={[
                  styles.dropdownText,
                  travellers === num && styles.selectedDropdownText
                ]}>
                  {num} Traveller{num === '1' ? '' : 's'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
    backgroundColor: COLORS.background,
  },
  header: {
    height: 280,
    overflow: 'hidden',
  },
  headerOverlay: {
    opacity: 0.5,
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: -60,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  dropdownCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    padding: 16,
    borderRadius: 8,
  },
  selectedDropdownItem: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectedDropdownText: {
    color: COLORS.purple,
    fontWeight: '600',
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
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
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
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBorder,
    paddingTop: 16,
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
    backgroundColor: 'rgba(104, 211, 145, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
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
    backgroundColor: 'rgba(0,0,0,0.05)',
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
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    padding: 8,
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
