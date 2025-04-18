// @ts-nocheck
/* eslint-disable */
// This file uses JSX which is handled by the React Native transpiler
// Disabling TypeScript checks to match the other components

import * as React from 'react'
const { useState, useEffect } = React
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
  blue: '#4F8EF7', // Blue accent color
  grey: '#CCCCCC', // Grey for inactive elements
}

const WINDOW_WIDTH = Dimensions.get('window').width

export default function TravelPlannerScreen() {
  const [startLocation, setStartLocation] = useState('Current Location')
  const [endLocation, setEndLocation] = useState('')
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [duration, setDuration] = useState('Any')
  const [travellers, setTravellers] = useState('1')
  const [budget, setBudget] = useState('Medium')
  const [routeType, setRouteType] = useState('Eco-friendly')
  const [userName, setUserName] = useState('Jatin')
  const [userLocation, setUserLocation] = useState('Bhopal')
  const [showMapModal, setShowMapModal] = useState(false)
  const insets = useSafeAreaInsets()

  // Dummy coordinates for map
  const [mapRegion, setMapRegion] = useState({
    latitude: 23.2599,
    longitude: 77.4126,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })

  // Load nearby places on startup
  useEffect(() => {
    fetchNearbyPlaces()
  }, [])

  const fetchNearbyPlaces = async () => {
    setIsLoading(true)
    try {
      const result = await findNearbyPlaces(userLocation)
      if (result.places) {
        setNearbyPlaces(result.places)
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyFilters = () => {
    setShowFilters(false)
    // Re-fetch nearby places with filters
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

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterButton}>
          <ThemedText style={styles.filterButtonText}>duration</ThemedText>
          <Ionicons name="chevron-down" size={16} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterButton}>
          <ThemedText style={styles.filterButtonText}>travellers</ThemedText>
          <Ionicons name="chevron-down" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterButton}>
          <ThemedText style={styles.filterButtonText}>budget</ThemedText>
          <Ionicons name="chevron-down" size={16} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterButton}>
          <ThemedText style={styles.filterButtonText}>route type</ThemedText>
          <Ionicons name="chevron-down" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
        <Ionicons name="search" size={20} color={COLORS.blue} />
        <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
      </TouchableOpacity>
    </View>
  )

  const renderNearbyPlaces = () => (
    <View style={styles.nearbyPlacesContainer}>
      <ThemedText style={styles.sectionTitle}>nearby places</ThemedText>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.orange}
          style={styles.loader}
        />
      ) : (
        nearbyPlaces.map((place, index) => (
          <View key={index} style={styles.placeItem}>
            <View style={styles.placeInfo}>
              <ThemedText style={styles.placeNumber}>
                {index + 1}. {place.name.toLowerCase()}
              </ThemedText>
              <View style={styles.placeDetails}>
                <ThemedText style={styles.placeDistance}>
                  distance: {place.distance}
                </ThemedText>
                <ThemedText style={styles.placeTime}>
                  time: {place.time}
                </ThemedText>
              </View>
            </View>
            <Image source={{ uri: place.imageUrl }} style={styles.placeImage} />
          </View>
        ))
      )}
    </View>
  )

  const renderRoutePlan = () => {
    // Simulate route plan with dummy data (for demo)
    const dummyStops = [
      {
        time: '07:32',
        location: '152 Dooley Drive Suite 484',
        description: 'Victoria Hotel',
        isCheckpoint: true,
      },
      {
        time: '10:27',
        location: '918 Rosario Fields',
        description: 'Gas station',
        isCheckpoint: true,
      },
      {
        time: '11:35',
        location: '570 Botsford Forks',
        description: 'Restaurant',
        isCheckpoint: false,
      },
      {
        time: '12:24',
        location: '242 Alanna Run',
        description: 'Dropoff',
        isCheckpoint: false,
      },
    ]

    return (
      <View style={styles.routePlanContainer}>
        <ThemedText style={styles.sectionTitle}>route plan</ThemedText>

        <View style={styles.routeContent}>
          <View style={styles.locationUpdater}>
            <ThemedText style={styles.locationText}>
              Update your location
            </ThemedText>
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={updateLocation}
            >
              <Ionicons name="radio-button-on" size={16} color={COLORS.white} />
              <ThemedText style={styles.currentLocationText}>
                Current Location
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.timeline}>
            {dummyStops.map((stop, index) => (
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
                  {index < dummyStops.length - 1 && (
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

        <TouchableOpacity
          style={styles.viewMapButton}
          onPress={() => setShowMapModal(true)}
        >
          <Ionicons name="map" size={16} color={COLORS.white} />
          <ThemedText style={styles.viewMapText}>View on Map</ThemedText>
        </TouchableOpacity>
      </View>
    )
  }

  // Modal for map view
  const renderMapModal = () => (
    <Modal
      visible={showMapModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowMapModal(false)}
    >
      <View style={styles.modalContainer}>
        <MapView style={styles.map} region={mapRegion}>
          {/* Start marker */}
          <Marker
            coordinate={{
              latitude: mapRegion.latitude - 0.02,
              longitude: mapRegion.longitude - 0.02,
            }}
            pinColor={COLORS.orange}
          />

          {/* End marker */}
          <Marker
            coordinate={{
              latitude: mapRegion.latitude + 0.01,
              longitude: mapRegion.longitude + 0.02,
            }}
            pinColor={COLORS.orange}
          />

          {/* Route line */}
          <Polyline
            coordinates={[
              {
                latitude: mapRegion.latitude - 0.02,
                longitude: mapRegion.longitude - 0.02,
              },
              {
                latitude: mapRegion.latitude - 0.01,
                longitude: mapRegion.longitude - 0.01,
              },
              { latitude: mapRegion.latitude, longitude: mapRegion.longitude },
              {
                latitude: mapRegion.latitude + 0.01,
                longitude: mapRegion.longitude + 0.02,
              },
            ]}
            strokeColor={COLORS.darkGreen}
            strokeWidth={4}
          />
        </MapView>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowMapModal(false)}
        >
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* Route details overlay */}
        <View style={styles.routeDetailsOverlay}>
          <View style={styles.timeline}>
            {/* Display route stops here (simplified for demo) */}
            <View style={styles.timelineItem}>
              <ThemedText style={styles.timelineTime}>07:32</ThemedText>
              <View style={styles.timelineMarkerContainer}>
                <View
                  style={[styles.timelineMarker, styles.checkpointMarker]}
                />
                <View style={styles.timelineConnector} />
              </View>
              <View style={styles.timelineContent}>
                <ThemedText style={styles.timelineLocation}>
                  152 Dooley Drive Suite 484
                </ThemedText>
                <ThemedText style={styles.timelineDescription}>
                  Victoria Hotel
                </ThemedText>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <ThemedText style={styles.timelineTime}>12:24</ThemedText>
              <View style={styles.timelineMarkerContainer}>
                <View style={[styles.timelineMarker, styles.regularMarker]} />
              </View>
              <View style={styles.timelineContent}>
                <ThemedText style={styles.timelineLocation}>
                  242 Alanna Run
                </ThemedText>
                <ThemedText style={styles.timelineDescription}>
                  Dropoff
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />

      {/* User greeting header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.profileCircle}>
          <Ionicons name="person" size={24} color={COLORS.darkBackground} />
        </View>
        <ThemedText style={styles.greeting}>hi, {userName}</ThemedText>
      </View>

      <ScrollView style={styles.content}>
        {/* Filters section */}
        {renderFilters()}

        {/* Nearby places section */}
        {renderNearbyPlaces()}

        {/* Route plan section */}
        {renderRoutePlan()}
      </ScrollView>

      {/* Map modal */}
      {renderMapModal()}
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  greeting: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: '400',
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.blue,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.grey,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '48%',
  },
  filterButtonText: {
    color: COLORS.white,
    marginRight: 5,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.blue,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'center',
    width: 120,
  },
  applyButtonText: {
    color: COLORS.blue,
    marginLeft: 5,
    fontWeight: '500',
  },
  nearbyPlacesContainer: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.blue,
  },
  sectionTitle: {
    fontSize: 26,
    color: COLORS.blue,
    marginBottom: 20,
  },
  placeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
  },
  placeNumber: {
    fontSize: 20,
    color: COLORS.blue,
    fontWeight: '500',
    marginBottom: 5,
  },
  placeDetails: {
    marginLeft: 10,
  },
  placeDistance: {
    color: COLORS.white,
    fontSize: 14,
  },
  placeTime: {
    color: COLORS.white,
    fontSize: 14,
  },
  placeImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  routePlanContainer: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    marginBottom: 100,
  },
  routeContent: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  locationUpdater: {
    alignItems: 'center',
    marginBottom: 15,
  },
  locationText: {
    color: '#888',
    marginBottom: 10,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.orange,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '100%',
  },
  currentLocationText: {
    color: COLORS.white,
    marginLeft: 8,
    fontWeight: '500',
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
    color: COLORS.orange,
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
    backgroundColor: '#1F2971', // Navy blue
  },
  regularMarker: {
    backgroundColor: '#888',
  },
  timelineConnector: {
    width: 2,
    height: 40,
    backgroundColor: '#ccc',
    position: 'absolute',
    top: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLocation: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  timelineDescription: {
    fontSize: 12,
    color: '#888',
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  },
  loader: {
    marginVertical: 20,
  },
})
