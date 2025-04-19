// @ts-nocheck
/* eslint-disable */
// This file uses JSX which is handled by the React Native transpiler
// Disabling TypeScript checks to match the other components

import * as React from 'react'
const { useState, useEffect, useRef } = React
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
  generateRoutePlan,
  findNearbyPlaces,
  RoutePlan,
  NearbyPlace,
} from '../services/geminiService'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Marker, Polyline } from 'react-native-maps'
import { useUser } from '@clerk/clerk-expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { WebView } from 'react-native-webview'
import { TOMTOM_API_KEY } from '../../constants/Config'
import { useNavigation, useRouter } from 'expo-router'

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
  orange: '#E86D28', // Orange for highlights and buttons
  darkBackground: '#111111', // Dark background color
  grey: '#CCCCCC', // Grey for inactive elements
}

const WINDOW_WIDTH = Dimensions.get('window').width

// AsyncStorage key for profile image
const PROFILE_IMAGE_KEY = 'user_profile_image'
// AsyncStorage key for saved route data
const SAVED_ROUTE_DATA_KEY = 'SAVED_ROUTE_DATA'

export default function TravelPlannerScreen() {
  const [startLocation, setStartLocation] = useState('Current Location')
  const [endLocation, setEndLocation] = useState('')
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [duration, setDuration] = useState('')
  const [travellers, setTravellers] = useState('1')
  const [budget, setBudget] = useState('')
  const [routeType, setRouteType] = useState('Eco-friendly')
  const [userName, setUserName] = useState('Jatin')
  const [userLocation, setUserLocation] = useState('Bhopal')
  const [showMapModal, setShowMapModal] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [showTravellersDropdown, setShowTravellersDropdown] = useState(false)
  const [showRouteTypeDropdown, setShowRouteTypeDropdown] = useState(false)
  const { user, isSignedIn } = useUser()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  // Remove map route data states
  const [destination, setDestination] = useState('')
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [planStops, setPlanStops] = useState<any[]>([])

  // Load profile image from AsyncStorage or Clerk
  useEffect(() => {
    const loadProfileImage = async () => {
      if (isSignedIn && user) {
        try {
          const storedImageUrl = await AsyncStorage.getItem(PROFILE_IMAGE_KEY)
          if (storedImageUrl) {
            setProfileImage(storedImageUrl)
          } else if (user.imageUrl) {
            setProfileImage(user.imageUrl)
            await AsyncStorage.setItem(PROFILE_IMAGE_KEY, user.imageUrl)
          }

          if (user.username || user.fullName) {
            setUserName(user.username || user.fullName || userName)
          }
        } catch (error) {
          console.error('Error loading profile image:', error)
        }
      } else {
        setProfileImage('https://randomuser.me/api/portraits/men/40.jpg')
      }
    }

    loadProfileImage()
  }, [isSignedIn, user])

  // Load nearby places on startup
  useEffect(() => {
    fetchNearbyPlaces()
  }, [])

  const fetchNearbyPlaces = async () => {
    if (!destination) return

    setIsLoading(true)
    try {
      const result = await findNearbyPlaces(destination)
      if (result.places) {
        setNearbyPlaces(result.places)
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Add useEffect to fetch nearby places when destination changes
  useEffect(() => {
    if (destination) {
      fetchNearbyPlaces()
    }
  }, [destination])

  // Navigate to the map screen
  const navigateToMapScreen = () => {
    router.push('/(tabs)/')
  }

  // Add new function to generate route plan
  const generateTravelPlan = async () => {
    if (!destination) {
      Alert.alert('Missing Information', 'Please enter a destination.')
      return
    }

    setIsGeneratingPlan(true)

    try {
      // Create a detailed prompt using user preferences
      const prompt = `Generate a detailed trip plan for ${destination} with the following preferences:
      - Duration: ${duration} days
      - Number of travelers: ${travellers}
      - Budget: ₹${budget}
      - Travel style: ${routeType}

      Focus only on places and activities within ${destination}. Include:
      1. Daily itinerary with specific times
      2. Must-visit attractions within the city
      3. Local experiences and activities
      4. Eco-friendly transportation options within the city
      5. Estimated costs for each activity
      6. Best times to visit each location
      7. Local tips and recommendations`

      const result = await generateRoutePlan(prompt)

      if (result.routePlan) {
        setRoutePlan(result.routePlan)
        if (result.routePlan.stops && result.routePlan.stops.length > 0) {
          setPlanStops(result.routePlan.stops)
        }
      }
    } catch (error) {
      console.error('Error generating route plan:', error)
      Alert.alert('Error', 'Failed to generate route plan. Please try again.')
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  const handleApplyFilters = () => {
    setShowTravellersDropdown(false)
    setShowRouteTypeDropdown(false)
    setShowFilters(false)

    fetchNearbyPlaces()
  }

  const navigateToPlace = (placeName: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      placeName
    )}`
    Linking.openURL(url).catch((err) =>
      console.error('Error opening navigation:', err)
    )
  }

  const updateLocation = () => {
    // In a real app, this would get the current GPS location
    setStartLocation('Current Location')
  }

  // Travellers options
  const travellersOptions = ['1', '2', '3', '4', '5+']

  // Route type options
  const routeTypeOptions = ['Eco-friendly', 'Fastest', 'Scenic', 'Adventure']

  // Function to render dropdown
  const renderDropdown = (options, currentValue, onSelect, visible, setVisible) => {
    if (!visible) return null;

    return (
      <View style={styles.dropdownContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dropdownItem,
              currentValue === option && styles.selectedDropdownItem
            ]}
            onPress={() => {
              onSelect(option);
              setVisible(false);
            }}
          >
            <ThemedText style={[
              styles.dropdownItemText,
              currentValue === option && styles.selectedDropdownItemText
            ]}>
              {option}
            </ThemedText>
            {currentValue === option && (
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ThemedText style={styles.tagline}>Plan Your Trip</ThemedText>

      <View style={styles.planningInputContainer}>
        <TextInput
          style={styles.planningInput}
          placeholder="Enter your destination..."
          value={destination}
          onChangeText={setDestination}
          placeholderTextColor={COLORS.soil}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterInputContainer}>
          <TextInput
            style={styles.filterInput}
            placeholder="Trip duration (days)"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholderTextColor={COLORS.soil}
          />
        </View>

        <View style={styles.filterInputContainer}>
          <TextInput
            style={styles.filterInput}
            placeholder="Budget (₹)"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            placeholderTextColor={COLORS.soil}
          />
        </View>

        <View style={styles.filterInputContainer}>
          <TextInput
            style={styles.filterInput}
            placeholder="No. of travellers"
            value={travellers}
            onChangeText={setTravellers}
            keyboardType="numeric"
            placeholderTextColor={COLORS.soil}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.planButton}
        onPress={generateTravelPlan}
        disabled={isGeneratingPlan}
      >
        {isGeneratingPlan ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="navigate" size={16} color={COLORS.white} />
            <ThemedText style={styles.planButtonText}>Plan Trip</ThemedText>
          </>
        )}
      </TouchableOpacity>
    </View>
  )

  const renderNearbyPlaces = () => (
    <View style={styles.nearbyPlacesContainer}>
      <ThemedText style={styles.sectionTitle}>
        {destination ? `Places to visit in ${destination}` : 'Enter destination to see places'}
      </ThemedText>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.leafGreen}
          style={styles.loader}
        />
      ) : nearbyPlaces.length > 0 ? (
        nearbyPlaces.map((place, index) => (
          <View key={index} style={styles.placeItem}>
            <View style={styles.placeInfo}>
              <ThemedText style={styles.placeNumber}>
                {index + 1}. {place.name}
              </ThemedText>
              <View style={styles.placeDetails}>
                <ThemedText style={styles.placeDistance}>
                  Distance from city center: {place.distance}
                </ThemedText>
                <ThemedText style={styles.placeTime}>
                  Best time to visit: {place.bestTime || 'All day'}
                </ThemedText>
                {place.entryFee && (
                  <ThemedText style={styles.placeEntryFee}>
                    Entry Fee: ₹{place.entryFee}
                  </ThemedText>
                )}
              </View>
              <ThemedText style={styles.placeDescription}>
                {place.description}
              </ThemedText>
            </View>
            <Image
              source={{ uri: place.imageUrl || 'https://via.placeholder.com/150' }}
              style={styles.placeImage}
            />
          </View>
        ))
      ) : (
        <ThemedText style={styles.noPlacesText}>
          No places found. Try entering a different destination.
        </ThemedText>
      )}
    </View>
  )

  const renderRoutePlan = () => {
    const stops = planStops.length > 0 ? planStops : [
      {
        time: '07:32',
        location: 'Victoria Hotel',
        description: 'Check-in and rest',
        isCheckpoint: true,
      },
      {
        time: '10:27',
        location: 'Local Market',
        description: 'Explore local culture',
        isCheckpoint: true,
      },
      {
        time: '11:35',
        location: 'Heritage Site',
        description: 'Visit historical landmarks',
        isCheckpoint: false,
      },
      {
        time: '12:24',
        location: 'Eco-friendly Restaurant',
        description: 'Lunch break',
        isCheckpoint: false,
      },
    ]

    return (
      <View style={styles.routePlanContainer}>
        <ThemedText style={styles.sectionTitle}>Trip Plan</ThemedText>

        <View style={styles.routeContent}>
          <View style={styles.locationUpdater}>
            <ThemedText style={styles.locationText}>
              {destination ? `Destination: ${destination}` : 'Enter destination above'}
            </ThemedText>

            {routePlan && routePlan.estimatedDistance && routePlan.estimatedDuration && (
              <View style={styles.routeSummary}>
                <View style={styles.routeSummaryItem}>
                  <Ionicons name="map" size={16} color={COLORS.darkGreen} />
                  <ThemedText style={styles.routeSummaryText}>
                    {routePlan.estimatedDistance}
                  </ThemedText>
                </View>
                <View style={styles.routeSummaryItem}>
                  <Ionicons name="time" size={16} color={COLORS.darkGreen} />
                  <ThemedText style={styles.routeSummaryText}>
                    {routePlan.estimatedDuration}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>

          <View style={styles.timeline}>
            {stops.map((stop, index) => (
              <View key={index} style={styles.timelineItem}>
                <ThemedText style={styles.timelineTime}>{stop.time}</ThemedText>
                <View style={styles.timelineMarkerContainer}>
                  <View
                    style={[
                      styles.timelineMarker,
                      stop.isCheckpoint
                        ? styles.checkpointMarker
                        : styles.regularMarker,
                    ]}
                  />
                  {index < stops.length - 1 && (
                    <View style={styles.timelineConnector} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <ThemedText style={styles.timelineLocation}>
                    {stop.location}
                  </ThemedText>
                  <ThemedText style={styles.timelineDescription}>
                    {stop.description}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ThemedText style={styles.greeting}>travel planner</ThemedText>
        <View style={styles.userInfoContainer}>
          <ThemedText style={styles.username}>{userName}</ThemedText>
          <View style={styles.profilePhotoContainer}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={24} color={COLORS.darkGreen} />
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {renderFilters()}
        {renderNearbyPlaces()}
        {renderRoutePlan()}
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.lightestGreen,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 197, 94, 0.2)',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhotoContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.leafGreen,
    backgroundColor: COLORS.paleGreen,
    overflow: 'hidden',
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    height: '100%',
    width: '100%',
    borderRadius: 20,
  },
  profileImagePlaceholder: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightestGreen,
  },
  greeting: {
    fontSize: 24,
    color: COLORS.darkGreen,
    fontWeight: '600',
  },
  username: {
    fontSize: 16,
    color: COLORS.bark,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  filtersContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 30,
    backgroundColor: COLORS.lightestGreen,
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tagline: {
    fontSize: 24,
    color: COLORS.darkGreen,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  filterInputContainer: {
    flex: 1,
  },
  filterInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    borderRadius: 25,
    padding: 12,
    fontSize: 14,
    color: COLORS.soil,
  },
  planningInputContainer: {
    marginBottom: 20,
  },
  planningInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    borderRadius: 25,
    padding: 12,
    fontSize: 14,
    color: COLORS.soil,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.leafGreen,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    width: '60%',
    marginTop: 10,
  },
  planButtonText: {
    color: COLORS.white,
    marginLeft: 5,
    fontWeight: '500',
  },
  nearbyPlacesContainer: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.bark,
    shadowColor: COLORS.bark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 26,
    color: COLORS.bark,
    fontWeight: '600',
    marginBottom: 20,
  },
  placeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'flex-start',
    backgroundColor: COLORS.lightestGreen,
    padding: 15,
    borderRadius: 25,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.leafGreen,
    gap: 15,
  },
  placeInfo: {
    flex: 1,
  },
  placeNumber: {
    fontSize: 20,
    color: COLORS.darkGreen,
    fontWeight: '500',
    marginBottom: 5,
  },
  placeDetails: {
    marginLeft: 10,
  },
  placeDistance: {
    color: COLORS.soil,
    fontSize: 14,
  },
  placeTime: {
    color: COLORS.soil,
    fontSize: 14,
  },
  placeImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  routePlanContainer: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    backgroundColor: COLORS.lightestGreen,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 100,
  },
  routeContent: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.paleGreen,
  },
  locationUpdater: {
    alignItems: 'center',
    marginBottom: 15,
  },
  locationText: {
    color: COLORS.soil,
    marginBottom: 10,
  },
  timeline: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  timelineTime: {
    width: 40,
    color: COLORS.bark,
    fontSize: 14,
    fontWeight: '500',
  },
  timelineMarkerContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  timelineMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  checkpointMarker: {
    backgroundColor: COLORS.leafGreen,
  },
  regularMarker: {
    backgroundColor: COLORS.lightBark,
  },
  timelineConnector: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.paleGreen,
    position: 'absolute',
    top: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLocation: {
    fontSize: 14,
    color: COLORS.soil,
    fontWeight: '500',
  },
  timelineDescription: {
    fontSize: 12,
    color: COLORS.lightBark,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.leafGreen,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  viewMapText: {
    color: COLORS.white,
    marginLeft: 8,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: COLORS.darkGreen,
    padding: 8,
    borderRadius: 20,
  },
  routeDetailsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '40%',
    borderTopWidth: 4,
    borderTopColor: COLORS.leafGreen,
  },
  loader: {
    marginVertical: 20,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    padding: 5,
    zIndex: 10,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  selectedDropdownItem: {
    backgroundColor: COLORS.leafGreen,
  },
  dropdownItemText: {
    color: COLORS.darkGreen,
  },
  selectedDropdownItemText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  routeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    backgroundColor: COLORS.paleGreen,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
  },
  routeSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeSummaryText: {
    marginLeft: 5,
    color: COLORS.darkGreen,
    fontWeight: '500',
    fontSize: 14,
  },
  mapDataInfoContainer: {
    backgroundColor: COLORS.paleGreen,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
    alignItems: 'center',
  },
  mapDataInfoText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '500',
    marginBottom: 5,
  },
  editMapRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  editMapRouteText: {
    color: COLORS.darkGreen,
    marginLeft: 5,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  chooseOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  chooseOnMapText: {
    color: COLORS.white,
    marginLeft: 8,
    fontWeight: '500',
  },
  mapRouteSummary: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 10,
    padding: 12,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
  },
  mapRouteTitle: {
    fontSize: 18,
    color: COLORS.darkGreen,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  mapRouteDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapRouteDetail: {
    color: COLORS.soil,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  placeDescription: {
    color: COLORS.soil,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  placeEntryFee: {
    color: COLORS.leafGreen,
    fontSize: 14,
    fontWeight: '500',
  },
  noPlacesText: {
    color: COLORS.soil,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
})
