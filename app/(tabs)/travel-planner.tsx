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
  const [duration, setDuration] = useState('Any')
  const [travellers, setTravellers] = useState('1')
  const [budget, setBudget] = useState('Medium')
  const [routeType, setRouteType] = useState('Eco-friendly')
  const [userName, setUserName] = useState('Jatin')
  const [userLocation, setUserLocation] = useState('Bhopal')
  const [showMapModal, setShowMapModal] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [showDurationDropdown, setShowDurationDropdown] = useState(false)
  const [showTravellersDropdown, setShowTravellersDropdown] = useState(false)
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false)
  const [showRouteTypeDropdown, setShowRouteTypeDropdown] = useState(false)
  const { user, isSignedIn } = useUser()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  // Add state to track if map route data exists
  const [hasMapRouteData, setHasMapRouteData] = useState(false)
  const [mapRouteData, setMapRouteData] = useState<any>(null)

  // Add new state variables for route planning
  const [planningLocation, setPlanningLocation] = useState('')
  const [destination, setDestination] = useState('')
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [planStops, setPlanStops] = useState<any[]>([])
  const [mapCoordinates, setMapCoordinates] = useState<{startLat: number, startLng: number, endLat: number, endLng: number} | null>(null)

  // Load saved route data from AsyncStorage on component mount
  useEffect(() => {
    const loadSavedRouteData = async () => {
      try {
        const savedRouteDataJson = await AsyncStorage.getItem(SAVED_ROUTE_DATA_KEY)

        if (savedRouteDataJson) {
          const savedRouteData = JSON.parse(savedRouteDataJson)
          setHasMapRouteData(true)
          setMapRouteData(savedRouteData)

          // Convert coordinates to address names (simplified version with placeholder text)
          if (savedRouteData.startLocation) {
            const startText = `${savedRouteData.startLocation.latitude.toFixed(4)}, ${savedRouteData.startLocation.longitude.toFixed(4)}`
            setPlanningLocation(startText)
          }

          if (savedRouteData.endLocation) {
            const endText = `${savedRouteData.endLocation.latitude.toFixed(4)}, ${savedRouteData.endLocation.longitude.toFixed(4)}`
            setDestination(endText)
          }

          // Set map coordinates for viewing the route
          if (savedRouteData.startLocation && savedRouteData.endLocation) {
            setMapCoordinates({
              startLat: savedRouteData.startLocation.latitude,
              startLng: savedRouteData.startLocation.longitude,
              endLat: savedRouteData.endLocation.latitude,
              endLng: savedRouteData.endLocation.longitude
            })
          }

          // Set route type from saved data if available
          if (savedRouteData.selectedOptions && savedRouteData.selectedOptions.type) {
            // Map the route type from index.tsx to our format
            const mapRouteType = (type) => {
              switch (type) {
                case 'fastest': return 'Fastest'
                case 'cost-effective': return 'Eco-friendly'
                case 'low-traffic': return 'Scenic'
                case 'long-drive': return 'Adventure'
                default: return 'Eco-friendly'
              }
            }
            setRouteType(mapRouteType(savedRouteData.selectedOptions.type))
          }
        }
      } catch (error) {
        console.error('Error loading saved route data:', error)
      }
    }

    loadSavedRouteData()
  }, [])

  // Load profile image from AsyncStorage or Clerk
  useEffect(() => {
    const loadProfileImage = async () => {
      if (isSignedIn && user) {
        try {
          // Try loading from AsyncStorage first
          const storedImageUrl = await AsyncStorage.getItem(PROFILE_IMAGE_KEY)
          if (storedImageUrl) {
            setProfileImage(storedImageUrl)
          } else if (user.imageUrl) {
            setProfileImage(user.imageUrl)
            await AsyncStorage.setItem(PROFILE_IMAGE_KEY, user.imageUrl)
          }

          // Update username from Clerk if available
          if (user.username || user.fullName) {
            setUserName(user.username || user.fullName || userName)
          }
        } catch (error) {
          console.error('Error loading profile image:', error)
        }
      } else {
        // If not signed in, use a placeholder image
        setProfileImage('https://randomuser.me/api/portraits/men/40.jpg')
      }
    }

    loadProfileImage()
  }, [isSignedIn, user])

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

  // Navigate to the map screen
  const navigateToMapScreen = () => {
    router.push('/(tabs)/')
  }

  // Add new function to generate route plan
  const generateTravelPlan = async () => {
    if (!planningLocation || !destination) {
      Alert.alert('Missing Information', 'Please enter both a starting location and destination.')
      return
    }

    setIsGeneratingPlan(true)

    try {
      const result = await generateRoutePlan(planningLocation, destination, {
        duration: duration,
        travellers: travellers,
        budget: budget,
        routeType: routeType
      })

      if (result.routePlan) {
        setRoutePlan(result.routePlan)
        // Update the stops for the timeline
        if (result.routePlan.stops && result.routePlan.stops.length > 0) {
          setPlanStops(result.routePlan.stops)
        }

        // Set map coordinates if available
        if (result.routePlan.startCoordinates && result.routePlan.endCoordinates) {
          setMapCoordinates({
            startLat: result.routePlan.startCoordinates.latitude,
            startLng: result.routePlan.startCoordinates.longitude,
            endLat: result.routePlan.endCoordinates.latitude,
            endLng: result.routePlan.endCoordinates.longitude
          })
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
    setShowDurationDropdown(false)
    setShowTravellersDropdown(false)
    setShowBudgetDropdown(false)
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

  // Duration options
  const durationOptions = ['Any', '1-3 days', '3-5 days', '5-7 days', '7+ days']

  // Travellers options
  const travellersOptions = ['1', '2', '3', '4', '5+']

  // Budget options
  const budgetOptions = ['Low', 'Medium', 'High']

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
      <View style={styles.planningInputContainer}>
        {hasMapRouteData ? (
          // Show the preloaded data from the map with a note
          <View style={styles.mapDataInfoContainer}>
            <ThemedText style={styles.mapDataInfoText}>
              Using route data from map
            </ThemedText>
            <TouchableOpacity
              style={styles.editMapRouteButton}
              onPress={navigateToMapScreen}
            >
              <Ionicons name="map-outline" size={16} color={COLORS.darkGreen} />
              <ThemedText style={styles.editMapRouteText}>Edit on Map</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          // Show a message prompting to use the map
          <TouchableOpacity
            style={styles.chooseOnMapButton}
            onPress={navigateToMapScreen}
          >
            <Ionicons name="map" size={20} color={COLORS.white} />
            <ThemedText style={styles.chooseOnMapText}>Choose locations on map</ThemedText>
          </TouchableOpacity>
        )}

        <TextInput
          style={hasMapRouteData ? styles.planningInputDisabled : styles.planningInput}
          placeholder="Starting location..."
          value={planningLocation}
          onChangeText={setPlanningLocation}
          placeholderTextColor={COLORS.soil}
          editable={!hasMapRouteData} // Disable if we have map data
        />
        <TextInput
          style={hasMapRouteData ? styles.planningInputDisabled : styles.planningInput}
          placeholder="Destination..."
          value={destination}
          onChangeText={setDestination}
          placeholderTextColor={COLORS.soil}
          editable={!hasMapRouteData} // Disable if we have map data
        />
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
              <ThemedText style={styles.planButtonText}>Plan Route</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <View style={{ width: '48%' }}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setShowDurationDropdown(!showDurationDropdown);
              setShowTravellersDropdown(false);
              setShowBudgetDropdown(false);
              setShowRouteTypeDropdown(false);
            }}
          >
            <ThemedText style={styles.filterButtonText}>duration: {duration}</ThemedText>
            <Ionicons
              name={showDurationDropdown ? "chevron-up" : "chevron-down"}
              size={16}
              color={COLORS.darkGreen}
            />
          </TouchableOpacity>
          {renderDropdown(
            durationOptions,
            duration,
            setDuration,
            showDurationDropdown,
            setShowDurationDropdown
          )}
        </View>

        <View style={{ width: '48%' }}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setShowTravellersDropdown(!showTravellersDropdown);
              setShowDurationDropdown(false);
              setShowBudgetDropdown(false);
              setShowRouteTypeDropdown(false);
            }}
          >
            <ThemedText style={styles.filterButtonText}>travellers: {travellers}</ThemedText>
            <Ionicons
              name={showTravellersDropdown ? "chevron-up" : "chevron-down"}
              size={16}
              color={COLORS.darkGreen}
            />
          </TouchableOpacity>
          {renderDropdown(
            travellersOptions,
            travellers,
            setTravellers,
            showTravellersDropdown,
            setShowTravellersDropdown
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={{ width: '48%' }}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setShowBudgetDropdown(!showBudgetDropdown);
              setShowDurationDropdown(false);
              setShowTravellersDropdown(false);
              setShowRouteTypeDropdown(false);
            }}
          >
            <ThemedText style={styles.filterButtonText}>budget: {budget}</ThemedText>
            <Ionicons
              name={showBudgetDropdown ? "chevron-up" : "chevron-down"}
              size={16}
              color={COLORS.darkGreen}
            />
          </TouchableOpacity>
          {renderDropdown(
            budgetOptions,
            budget,
            setBudget,
            showBudgetDropdown,
            setShowBudgetDropdown
          )}
        </View>

        <View style={{ width: '48%' }}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setShowRouteTypeDropdown(!showRouteTypeDropdown);
              setShowDurationDropdown(false);
              setShowTravellersDropdown(false);
              setShowBudgetDropdown(false);
            }}
          >
            <ThemedText style={styles.filterButtonText}>route: {routeType}</ThemedText>
            <Ionicons
              name={showRouteTypeDropdown ? "chevron-up" : "chevron-down"}
              size={16}
              color={COLORS.darkGreen}
            />
          </TouchableOpacity>
          {renderDropdown(
            routeTypeOptions,
            routeType,
            setRouteType,
            showRouteTypeDropdown,
            setShowRouteTypeDropdown
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
        <Ionicons name="search" size={20} color={COLORS.white} />
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
          color={COLORS.leafGreen}
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
    // Update to use generated plan stops if available, otherwise fallback to dummy data
    const stops = planStops.length > 0 ? planStops : [
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
              {planningLocation ? `From: ${planningLocation}` : 'Enter starting location above'}
            </ThemedText>
            <ThemedText style={styles.locationText}>
              {destination ? `To: ${destination}` : 'Enter destination above'}
            </ThemedText>

            {/* Display map route data summary if available */}
            {hasMapRouteData && mapRouteData && (
              <View style={styles.mapRouteSummary}>
                <ThemedText style={styles.mapRouteTitle}>Map Route Data</ThemedText>

                {mapRouteData.routeDetails && (
                  <>
                    <View style={styles.mapRouteDetailRow}>
                      <Ionicons name="navigate" size={16} color={COLORS.darkGreen} />
                      <ThemedText style={styles.mapRouteDetail}>
                        Distance: {mapRouteData.routeDetails.distance}
                      </ThemedText>
                    </View>

                    <View style={styles.mapRouteDetailRow}>
                      <Ionicons name="time" size={16} color={COLORS.darkGreen} />
                      <ThemedText style={styles.mapRouteDetail}>
                        Time: {mapRouteData.routeDetails.duration}
                      </ThemedText>
                    </View>

                    {mapRouteData.routeDetails.co2Emission && (
                      <View style={styles.mapRouteDetailRow}>
                        <Ionicons name="leaf" size={16} color={COLORS.darkGreen} />
                        <ThemedText style={styles.mapRouteDetail}>
                          CO₂: {mapRouteData.routeDetails.co2Emission}
                        </ThemedText>
                      </View>
                    )}

                    {mapRouteData.routeDetails.selectedVehicle && (
                      <View style={styles.mapRouteDetailRow}>
                        <Ionicons name="car" size={16} color={COLORS.darkGreen} />
                        <ThemedText style={styles.mapRouteDetail}>
                          Vehicle: {mapRouteData.routeDetails.selectedVehicle.vehicle}
                        </ThemedText>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

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

          {/* Show timeline only if we don't have map data or if we have generated a plan */}
          {(!hasMapRouteData || planStops.length > 0) && (
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
          )}
        </View>

        <TouchableOpacity
          style={styles.viewMapButton}
          onPress={hasMapRouteData ? navigateToMapScreen : handleViewMap}
          disabled={!hasMapRouteData && !mapCoordinates}
        >
          <Ionicons name="map" size={16} color={COLORS.white} />
          <ThemedText style={styles.viewMapText}>
            {hasMapRouteData ? "Return to Map" : "View on Map"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    )
  }

  // Add a reference for the webview in the map modal
  const webViewRef = useRef(null);

  const handleViewMap = () => {
    if (!mapCoordinates) {
      Alert.alert('No Coordinates', 'Cannot view on map as coordinates are missing.')
      return
    }

    // Using route parameters to share location data with the map screen
    setShowMapModal(true)

    // Set the map region and markers based on the coordinates
    if (webViewRef.current) {
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          if (map) {
            // Add start marker
            addStartMarker(${mapCoordinates.startLat}, ${mapCoordinates.startLng});

            // Add end marker
            addEndMarker(${mapCoordinates.endLat}, ${mapCoordinates.endLng});

            // Center map to show both markers
            var bounds = new tt.LngLatBounds();
            bounds.extend([${mapCoordinates.startLng}, ${mapCoordinates.startLat}]);
            bounds.extend([${mapCoordinates.endLng}, ${mapCoordinates.endLat}]);

            map.fitBounds(bounds, {
              padding: {top: 50, bottom: 50, left: 50, right: 50},
              maxZoom: 15
            });

            true;
          }
        `);
      }, 500);
    }
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
        <WebView
          ref={webViewRef}
          source={{ html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="stylesheet" type="text/css" href="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css">
              <style>
                body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
                .marker { width: 30px; height: 30px; }
                .marker-start { background-color: ${COLORS.leafGreen}; border-radius: 50%; }
                .marker-end { background-color: ${COLORS.bark}; border-radius: 50%; }
              </style>
            </head>
            <body>
              <div id="map"></div>
              <script src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"></script>
              <script src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/services/services-web.min.js"></script>
              <script>
                var map;
                var startMarker;
                var endMarker;
                var routeLayer;

                const apiKey = '${TOMTOM_API_KEY}';

                function initMap() {
                  map = tt.map({
                    key: apiKey,
                    container: 'map',
                    center: [77.4126, 23.2599], // Default center (Bhopal)
                    zoom: 13
                  });
                }

                function addStartMarker(lat, lng) {
                  if (startMarker) {
                    startMarker.remove();
                  }

                  var el = document.createElement('div');
                  el.className = 'marker marker-start';

                  startMarker = new tt.Marker({element: el})
                    .setLngLat([lng, lat])
                    .addTo(map);
                }

                function addEndMarker(lat, lng) {
                  if (endMarker) {
                    endMarker.remove();
                  }

                  var el = document.createElement('div');
                  el.className = 'marker marker-end';

                  endMarker = new tt.Marker({element: el})
                    .setLngLat([lng, lat])
                    .addTo(map);
                }

                // Initialize the map
                document.addEventListener('DOMContentLoaded', initMap);
              </script>
            </body>
            </html>
          ` }}
          style={styles.map}
          javaScriptEnabled={true}
          geolocationEnabled={true}
          onMessage={(event) => {
            console.log('WebView message:', event.nativeEvent.data);
          }}
        />

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowMapModal(false)}
        >
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </Modal>
  )

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="dark" />

      {/* User greeting header */}
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
    borderRadius: 12,
    backgroundColor: COLORS.lightestGreen,
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    borderColor: COLORS.darkGreen,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '48%',
  },
  filterButtonText: {
    color: COLORS.darkGreen,
    marginRight: 5,
    fontWeight: '500',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.leafGreen,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'center',
    width: 120,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  applyButtonText: {
    color: COLORS.white,
    marginLeft: 5,
    fontWeight: '500',
  },
  nearbyPlacesContainer: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
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
    alignItems: 'center',
    backgroundColor: COLORS.lightestGreen,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.leafGreen,
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
    width: 70,
    height: 70,
    borderRadius: 10,
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
  planningInputContainer: {
    marginBottom: 15,
  },
  planningInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    color: COLORS.soil,
  },
  planningInputDisabled: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    color: COLORS.soil,
    opacity: 0.7,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.leafGreen,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: 'center',
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    width: '60%',
  },
  planButtonText: {
    color: COLORS.white,
    marginLeft: 5,
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
})
