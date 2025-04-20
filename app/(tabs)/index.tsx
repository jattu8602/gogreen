import React, { useState, useRef, useEffect } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from 'react-native'
import { WebView } from 'react-native-webview'
import * as Location from 'expo-location'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useUser } from '@clerk/clerk-expo'
import { v5 as uuidv5 } from 'uuid'
import { getUUIDFromClerkID } from '@/lib/userService'
import { calculateGreenPoints, saveRoute } from '@/lib/routeService'
import { TOMTOM_API_KEY, isTomTomKeyValid } from '../../constants/Config'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'

interface Location {
  latitude: number
  longitude: number
}

interface RouteOption {
  type: 'fastest' | 'cost-effective' | 'low-traffic' | 'long-drive'
}

interface VehicleRecommendation {
  vehicle:
    | 'car'
    | 'bike'
    | 'walk'
    | 'train'
    | 'auto'
    | 'cycle'
    | 'taxi'
    | 'bus'
    | 'metro'
    | 'rickshaw'
  greenScore: number
  co2Emission: string
  isElectric?: boolean
  isCNG?: boolean
}

interface RouteDetails {
  distance: string
  duration: string
  co2Emission: string
  batteryUsage?: string
  recommendedVehicles?: VehicleRecommendation[]
  selectedVehicle?: VehicleRecommendation
}

// TomTom routing type mapping
const getTomTomRouteType = (type: string): string => {
  switch (type) {
    case 'fastest':
      return 'fastest'
    case 'cost-effective':
      return 'eco'
    case 'low-traffic':
      return 'thrilling'
    case 'long-drive':
      return 'shortest'
    default:
      return 'fastest'
  }
}

// TomTom vehicle type mapping
const getTomTomVehicleType = (vehicle: string): string => {
  switch (vehicle) {
    case 'car':
      return 'car'
    case 'bike':
    case 'cycle':
      return 'bicycle'
    case 'walk':
      return 'pedestrian'
    case 'train':
      return 'bus' // TomTom doesn't have train specifically
    case 'auto':
    case 'taxi':
      return 'taxi'
    default:
      return 'car'
  }
}

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
  warmGreen: '#8BC34A', // New color for notifications
  notificationBg: '#FFEBEE', // Background color for notification items
  notificationGreen: '#4CAF50', // Green color for notification items
}

// Add notification types
interface Notification {
  id: string;
  type: 'progress' | 'achievement' | 'suggestion' | 'update';
  title: string;
  message: string;
  icon: string;
  timestamp: Date;
  read: boolean;
}

// Add notification templates
const notificationTemplates: Array<{
  type: 'progress' | 'achievement' | 'suggestion' | 'update';
  title: string;
  message: string;
  icon: string;
}> = [
  {
    type: 'progress',
    title: '🌱 Green Milestone!',
    message: 'You\'ve saved 5kg of CO₂ this week! Keep up the great work!',
    icon: 'leaf',
  },
  {
    type: 'suggestion',
    title: '🚲 New Route Suggestion',
    message: 'Try our new eco-friendly bike route to work. It\'s 15% greener!',
    icon: 'bicycle',
  },
  {
    type: 'achievement',
    title: '🏆 Level Up!',
    message: 'Congratulations! You\'ve reached Green Explorer level!',
    icon: 'trophy',
  },
  {
    type: 'update',
    title: '✨ New Feature',
    message: 'Check out our new carbon footprint calculator!',
    icon: 'calculator',
  },
  {
    type: 'progress',
    title: '🌍 Environmental Impact',
    message: 'Your eco-friendly choices have saved 10 trees this month!',
    icon: 'tree',
  },
  {
    type: 'suggestion',
    title: '🌞 Weather Alert',
    message: 'Perfect day for walking! Consider eco-friendly transportation.',
    icon: 'sunny',
  },
  {
    type: 'achievement',
    title: '🎯 Daily Goal',
    message: 'You\'re 80% closer to your weekly green points target!',
    icon: 'target',
  },
  {
    type: 'update',
    title: '📊 Weekly Stats',
    message: 'You\'ve reduced your carbon footprint by 25% this week!',
    icon: 'stats-chart',
  },
];

export default function TabOneScreen() {
  const webViewRef = useRef<WebView>(null)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [startLocation, setStartLocation] = useState<Location | null>(null)
  const [endLocation, setEndLocation] = useState<Location | null>(null)
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([])
  const [showOptions, setShowOptions] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<RouteOption>({
    type: 'fastest',
  })
  const [recommendedVehicles, setRecommendedVehicles] = useState<
    VehicleRecommendation[]
  >([])
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleRecommendation | null>(null)
  const [routeInfo, setRouteInfo] = useState('')
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAIDescription, setShowAIDescription] = useState(false)
  const [aiRouteDescription, setAIRouteDescription] = useState('')
  const [aiDescriptionLoading, setAIDescriptionLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [webViewKey, setWebViewKey] = useState(1)
  const [mapHtml, setMapHtml] = useState('')
  const { user, isSignedIn } = useUser()
  const [routeSaved, setRouteSaved] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null)
  const [savedRouteHistory, setSavedRouteHistory] = useState<{
    startLocation: Location | null;
    endLocation: Location | null;
    routeDetails: RouteDetails | null;
    selectedVehicle: VehicleRecommendation | null;
    routeInfo: string;
    earnedPoints: number | null;
  } | null>(null)
  const [routeError, setRouteError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showAchievement, setShowAchievement] = useState(false)
  const [achievementPoints, setAchievementPoints] = useState(0)
  const [showResetMarkersModal, setShowResetMarkersModal] = useState(false)
  const [showResetRouteModal, setShowResetRouteModal] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationTimer = useRef<NodeJS.Timeout | null>(null);

  // Load saved route data from AsyncStorage on initial load
  useEffect(() => {
    const loadSavedRouteData = async () => {
      try {
        const savedRouteData = await AsyncStorage.getItem('SAVED_ROUTE_DATA');
        if (savedRouteData) {
          const parsedData = JSON.parse(savedRouteData);
          // Restore saved route state
          if (parsedData.routeSaved) {
            setRouteSaved(true);
            setEarnedPoints(parsedData.earnedPoints);
            setStartLocation(parsedData.startLocation);
            setEndLocation(parsedData.endLocation);
            setRouteDetails(parsedData.routeDetails);
            setSelectedVehicle(parsedData.selectedVehicle);
            setRouteInfo(parsedData.routeInfo);
            setRouteCoordinates(parsedData.routeCoordinates);
            setSelectedOptions(parsedData.selectedOptions);

            // Wait for the WebView to initialize before drawing the route
            setTimeout(() => {
              if (webViewRef.current) {
                // Add start marker
                if (parsedData.startLocation) {
                  webViewRef.current.injectJavaScript(
                    `addStartMarker(${parsedData.startLocation.latitude}, ${parsedData.startLocation.longitude}); true;`
                  );
                }

                // Add end marker
                if (parsedData.endLocation) {
                  webViewRef.current.injectJavaScript(
                    `addEndMarker(${parsedData.endLocation.latitude}, ${parsedData.endLocation.longitude}); true;`
                  );
                }

                // Draw the route line
                if (parsedData.routeCoordinates && parsedData.routeCoordinates.length > 0) {
                  const geoJson = {
                    type: 'FeatureCollection',
                    features: [
                      {
                        type: 'Feature',
                        geometry: {
                          type: 'LineString',
                          coordinates: parsedData.routeCoordinates.map((coord: Location) => [
                            coord.longitude,
                            coord.latitude,
                          ]),
                        },
                        properties: {},
                      },
                    ],
                  };

                  webViewRef.current.injectJavaScript(
                    `displayRoute(${JSON.stringify(geoJson)}); true;`
                  );
                }
              }
            }, 1000); // Give the map a second to initialize
          }
        }
      } catch (error) {
        console.error('Error loading saved route data:', error);
      }
    };

    loadSavedRouteData();
  }, []);

  useEffect(() => {
    ;(async () => {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        console.log('Permission to access location was denied')
        return
      }

      // Validate TomTom API key first
      if (!isTomTomKeyValid()) {
        Alert.alert(
          'API Key Error',
          'The TomTom API key appears to be invalid. The map may not load correctly.',
          [{ text: 'OK' }]
        )
      }

      let location = await Location.getCurrentPositionAsync({})
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      initMap(location.coords.latitude, location.coords.longitude)
    })()
  }, [])

  const initMap = (latitude: number, longitude: number) => {
    console.log('Initializing map with coordinates:', latitude, longitude)

    // Don't log the full API key in production - this is for debugging only
    if (__DEV__) {
      console.log(
        'Using TomTom API key starting with:',
        TOMTOM_API_KEY.substring(0, 5) + '...'
      )
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" type="text/css" href="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css">
      <style>
        body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
        .marker { width: 30px; height: 30px; }
        .marker-start { background-color: green; border-radius: 50%; }
        .marker-end { background-color: red; border-radius: 50%; }
        .touch-feedback { width: 40px; height: 40px; background-color: rgba(0,0,0,0.2); border-radius: 50%; position: absolute; }
        .error-overlay { position: absolute; top: 0; left: 0; right: 0; padding: 10px; background-color: rgba(255,0,0,0.7); color: white; font-size: 12px; z-index: 1000; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div id="error-message" class="error-overlay" style="display:none;"></div>
      <script>
        // Helper function to display errors on screen for debugging
        function showError(message) {
          console.error("Map error:", message);
          const errorElement = document.getElementById('error-message');
          errorElement.textContent = "Map Error: " + message;
          errorElement.style.display = 'block';

          // Send error to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapError',
              error: message
            }));
          }
        }

        // Global error handler
        window.onerror = function(message, source, lineno, colno, error) {
          showError('JS Error: ' + message + ' at line ' + lineno);
          return true;
        };

        // Load TomTom SDK with error handling
        function loadScript(url, callback) {
          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = url;
          script.onerror = function() {
            showError('Failed to load TomTom SDK from: ' + url);
          };
          script.onload = callback;
          document.head.appendChild(script);
        }

        // First load the maps SDK
        loadScript('https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js', function() {
          // Then load the services SDK
          loadScript('https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/services/services-web.min.js', initializeMap);
        });

        var map;
        var startMarker;
        var endMarker;
        var routeLayer;

        function initializeMap() {
          console.log('Initializing TomTom map...');
          try {
            if (!tt) {
              showError('TomTom SDK not loaded (tt is undefined)');
              return;
            }

            // Check if API key is provided
            const apiKey = '${TOMTOM_API_KEY}';
            if (!apiKey || apiKey === 'undefined' || apiKey === '') {
              showError('TomTom API key is missing or invalid');
              return;
            }

            map = tt.map({
              key: apiKey,
              container: 'map',
              center: [${longitude}, ${latitude}],
              zoom: 13
            });

            map.on('load', function() {
              console.log('Map loaded successfully');
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'mapLoaded'}));
            });

            map.on('error', function(e) {
              console.error('TomTom map error:', e);
              let errorMessage = 'Unknown map error';

              if (e.error) {
                errorMessage = typeof e.error === 'string' ? e.error : JSON.stringify(e.error);
              } else if (e.message) {
                errorMessage = e.message;
              } else {
                errorMessage = JSON.stringify(e);
              }

              showError(errorMessage);
            });

            map.on('click', function(e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                lat: e.lngLat.lat,
                lng: e.lngLat.lng
              }));

              var el = document.createElement('div');
              el.className = 'touch-feedback';
              el.style.left = (e.point.x - 20) + 'px';
              el.style.top = (e.point.y - 20) + 'px';
              document.body.appendChild(el);

              setTimeout(function() {
                document.body.removeChild(el);
              }, 300);
            });
          } catch (error) {
            console.error('Error initializing map:', error);
            showError(error.message || 'Failed to initialize map');
          }
        }

        function addStartMarker(lat, lng) {
          try {
            if (!map) {
              showError('Map not initialized');
              return;
            }

            if (startMarker) {
              startMarker.remove();
            }

            var el = document.createElement('div');
            el.className = 'marker marker-start';

            startMarker = new tt.Marker({element: el})
              .setLngLat([lng, lat])
              .addTo(map);

            // Notify React Native about success
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerAdded',
              markerType: 'start'
            }));
          } catch (error) {
            showError('Failed to add start marker: ' + error.message);
          }
        }

        function addEndMarker(lat, lng) {
          try {
            if (!map) {
              showError('Map not initialized');
              return;
            }

            if (endMarker) {
              endMarker.remove();
            }

            var el = document.createElement('div');
            el.className = 'marker marker-end';

            endMarker = new tt.Marker({element: el})
              .setLngLat([lng, lat])
              .addTo(map);

            // Notify React Native about success
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerAdded',
              markerType: 'end'
            }));
          } catch (error) {
            showError('Failed to add end marker: ' + error.message);
          }
        }

        function clearRoute() {
          try {
            if (!map) {
              showError('Map not initialized');
              return;
            }

            if (routeLayer) {
              if (map.getLayer(routeLayer.id)) {
                map.removeLayer(routeLayer.id);
              }
              if (map.getSource(routeLayer.sourceId)) {
                map.removeSource(routeLayer.sourceId);
              }
              routeLayer = null;
            }

            if (startMarker) {
              startMarker.remove();
              startMarker = null;
            }

            if (endMarker) {
              endMarker.remove();
              endMarker = null;
            }

            // Notify React Native about success
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'routeCleared'
            }));
          } catch (error) {
            showError('Failed to clear route: ' + error.message);
          }
        }

        function clearMarkers() {
          try {
            if (!map) {
              console.log('Map not initialized yet');
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markersCleared',
                status: 'warning',
                message: 'Map not initialized yet'
              }));
              return;
            }

            if (startMarker) {
              startMarker.remove();
              startMarker = null;
            }

            if (endMarker) {
              endMarker.remove();
              endMarker = null;
            }

            // Notify React Native about success
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markersCleared',
              status: 'success'
            }));
          } catch (error) {
            console.error('Error clearing markers:', error);
            showError('Failed to clear markers: ' + error.message);
          }
        }

        function displayRoute(routeGeoJson) {
          try {
            if (!map) {
              showError('Map not initialized');
              return;
            }

            if (routeLayer) {
              if (map.getLayer(routeLayer.id)) {
                map.removeLayer(routeLayer.id);
              }
              if (map.getSource(routeLayer.sourceId)) {
                map.removeSource(routeLayer.sourceId);
              }
            }

            var sourceId = 'route-source-' + Date.now();
            var layerId = 'route-layer-' + Date.now();

            map.addSource(sourceId, {
              type: 'geojson',
              data: routeGeoJson
            });

            map.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#2196F3',
                'line-width': 6
              }
            });

            routeLayer = {
              id: layerId,
              sourceId: sourceId
            };

            var coordinates = routeGeoJson.features[0].geometry.coordinates;
            var bounds = coordinates.reduce(function(bounds, coord) {
              return bounds.extend(coord);
            }, new tt.LngLatBounds(coordinates[0], coordinates[0]));

            map.fitBounds(bounds, {
              padding: {top: 50, bottom: 50, left: 50, right: 50},
              maxZoom: 15
            });

            // Notify React Native about success
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'routeDisplayed'
            }));
          } catch (error) {
            showError('Failed to display route: ' + error.message);
          }
        }

        function centerOnLocation(lat, lng, zoom) {
          try {
            if (!map) {
              showError('Map not initialized');
              return;
            }

            map.flyTo({
              center: [lng, lat],
              zoom: zoom || 15
            });

            // Notify React Native about success
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapCentered'
            }));
          } catch (error) {
            showError('Failed to center map: ' + error.message);
          }
        }
      </script>
    </body>
    </html>
    `

    setMapHtml(html)
  }

  const handleMapPress = (coordinate: Location) => {
    if (!startLocation) {
      setStartLocation(coordinate)
      webViewRef.current?.injectJavaScript(
        `addStartMarker(${coordinate.latitude}, ${coordinate.longitude}); true;`
      )
    } else if (!endLocation) {
      setEndLocation(coordinate)
      webViewRef.current?.injectJavaScript(
        `addEndMarker(${coordinate.latitude}, ${coordinate.longitude}); true;`
      )
      setShowOptions(true)
    }
  }

  const recenterMap = () => {
    if (userLocation) {
      webViewRef.current?.injectJavaScript(
        `centerOnLocation(${userLocation.latitude}, ${userLocation.longitude}, 13); true;`
      )
    }
  }

  const resetRoute = () => {
    setShowResetRouteModal(true)
  }

  const handleResetRoute = async () => {
    // Clear all route data
    setStartLocation(null)
    setEndLocation(null)
    setRouteCoordinates([])
    setRouteInfo('')
    setRouteDetails(null)
    setAIRouteDescription('')
    setRouteSaved(false)
    setEarnedPoints(null)
    setSavedRouteHistory(null)

    // Clear the route on the map
    webViewRef.current?.injectJavaScript('clearRoute(); true;')

    // Clear saved route data from AsyncStorage
    try {
      await AsyncStorage.removeItem('SAVED_ROUTE_DATA')
    } catch (error) {
      console.error('Error clearing saved route data:', error)
    }

    // Hide the modal after reset
    setShowResetRouteModal(false)
  }

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)

      if (data.type === 'mapClick') {
        const coordinate = {
          latitude: data.lat,
          longitude: data.lng,
        }

        handleMapPress(coordinate)
      } else if (data.type === 'mapLoaded') {
        console.log('Map loaded message received from WebView')
        if (userLocation) {
          recenterMap()
        }
      } else if (data.type === 'mapError') {
        console.error('Map error received from WebView:', data.error)
        Alert.alert(
          'Map Error',
          `There was an error loading the map: ${data.error}. Please check your connection and API key.`,
          [{ text: 'OK' }]
        )
      } else if (data.type === 'markersCleared') {
        if (data.status === 'success') {
          console.log('Markers cleared successfully')
        } else {
          console.warn('Warning clearing markers:', data.message)
        }
      } else if (data.type === 'routeCleared') {
        console.log('Route cleared successfully')
      } else if (data.type === 'markerAdded') {
        console.log(`${data.markerType} marker added successfully`)
      } else if (data.type === 'routeDisplayed') {
        console.log('Route displayed successfully')
      } else if (data.type === 'mapCentered') {
        console.log('Map centered successfully')
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error)
    }
  }

  // Modify the search functionality
  const handleSearchInput = (text: string) => {
    setSearchQuery(text);

    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for auto-search
    const timeout = setTimeout(() => {
      if (text.trim().length > 2) { // Only search if more than 2 characters
        searchLocation(text);
      } else {
        setShowSearchResults(false);
      }
    }, 500); // 500ms delay

    setSearchTimeout(timeout);
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) return;

    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(
          query
        )}.json?key=${TOMTOM_API_KEY}`
      );

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Error', 'Failed to search for locations');
    }
  };

  // Update the search results container to show below the search bar
  const renderSearchResults = () => {
    if (!showSearchResults) return null;

    return (
      <View style={[styles.searchResultsContainer, { top: 90 }]}>
        <ScrollView style={styles.searchResultsList}>
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={styles.searchResultItem}
              onPress={() => selectSearchResult(result)}
            >
              <Text style={styles.searchResultName}>
                {result.poi?.name || result.address.freeformAddress}
              </Text>
              <Text style={styles.searchResultAddress}>
                {result.address.freeformAddress}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const selectSearchResult = (result: any) => {
    const coordinate = {
      latitude: result.position.lat,
      longitude: result.position.lon,
    }

    if (!startLocation) {
      setStartLocation(coordinate)
      webViewRef.current?.injectJavaScript(
        `addStartMarker(${coordinate.latitude}, ${coordinate.longitude}); true;`
      )
    } else if (!endLocation) {
      setEndLocation(coordinate)
      webViewRef.current?.injectJavaScript(
        `addEndMarker(${coordinate.latitude}, ${coordinate.longitude}); true;`
      )
      setShowOptions(true)
    }

    setShowSearchResults(false)
    setSearchQuery('')

    webViewRef.current?.injectJavaScript(
      `centerOnLocation(${coordinate.latitude}, ${coordinate.longitude}, 15); true;`
    )
  }

  const getRouteDescription = async () => {
    if (!startLocation || !endLocation || routeCoordinates.length < 2) {
      Alert.alert('No Route', 'Please create a route first')
      return
    }

    setAIDescriptionLoading(true)

    const fallbackDescription =
      `This is a ${selectedOptions.type} route.\n\n` +
      `Distance: ${routeDetails?.distance || 'Unknown'}\n` +
      `Estimated Time: ${routeDetails?.duration || 'Unknown'}\n` +
      `CO₂ Emission: ${routeDetails?.co2Emission || 'Unknown'}\n` +
      (selectedVehicle?.vehicle === 'car' &&
      routeDetails?.batteryUsage !== 'N/A'
        ? `Battery Usage: ${routeDetails?.batteryUsage}\n\n`
        : '\n') +
      `Plan ahead and drive safely!`

    try {
      const mockDescription =
        `Your ${selectedOptions.type} route will take approximately ${routeDetails?.duration} to travel ${routeDetails?.distance}.\n\n` +
        `Key points on this journey:\n` +
        `• The route follows main roads with moderate traffic\n` +
        `• You may encounter traffic signals at major intersections\n` +
        `• CO₂ emission for this trip is estimated at ${routeDetails?.co2Emission}\n` +
        (selectedVehicle?.vehicle === 'car'
          ? `• Electric vehicle battery usage: approximately ${routeDetails?.batteryUsage}\n\n`
          : '\n') +
        `Tips:\n` +
        `• ${
          selectedOptions.type === 'fastest'
            ? 'This route prioritizes speed over fuel efficiency'
            : selectedOptions.type === 'cost-effective'
            ? 'This route balances time and fuel efficiency'
            : selectedOptions.type === 'low-traffic'
            ? 'This route avoids congested areas where possible'
            : 'This scenic route is longer but more enjoyable'
        }\n` +
        `• Consider traveling outside peak hours for a smoother journey\n` +
        `• The route is suitable for ${selectedVehicle?.vehicle} travel`

      setAIRouteDescription(mockDescription)
      setShowAIDescription(true)
    } catch (error) {
      console.error('Error getting route description:', error)
      setAIRouteDescription(fallbackDescription)
      setShowAIDescription(true)
    } finally {
      setAIDescriptionLoading(false)
    }
  }

  const determineRecommendedVehicles = (
    distance: number
  ): VehicleRecommendation[] => {
    const vehicles: VehicleRecommendation[] = []

    // For short distances (less than 3 km)
    if (distance < 3) {
      vehicles.push({
        vehicle: 'walk',
        greenScore: 50,
        co2Emission: '0 kg',
        isElectric: false,
        isCNG: false,
      })
      vehicles.push({
        vehicle: 'bike',
        greenScore: 40,
        co2Emission: '0 kg',
        isElectric: false,
        isCNG: false,
      })
      vehicles.push({
        vehicle: 'cycle',
        greenScore: 45,
        co2Emission: '0 kg',
        isElectric: false,
        isCNG: false,
      })
    }

    // For medium distances (less than 10 km)
    if (distance < 10) {
      vehicles.push({
        vehicle: 'rickshaw',
        greenScore: 30,
        co2Emission: `${(distance * 0.05).toFixed(2)} kg`,
        isElectric: true,
        isCNG: false,
      })
      vehicles.push({
        vehicle: 'auto',
        greenScore: 25,
        co2Emission: `${(distance * 0.08).toFixed(2)} kg`,
        isElectric: false,
        isCNG: true,
      })
    }

    // For all distances
    vehicles.push({
      vehicle: 'car',
      greenScore: 15,
      co2Emission: `${(distance * 0.12).toFixed(2)} kg`,
      isElectric: true,
      isCNG: false,
    })

    // For medium and long distances
    if (distance >= 3) {
      vehicles.push({
        vehicle: 'bus',
        greenScore: 35,
        co2Emission: `${(distance * 0.04).toFixed(2)} kg`,
        isElectric: false,
        isCNG: true,
      })
    }

    // For longer distances
    if (distance >= 5) {
      vehicles.push({
        vehicle: 'metro',
        greenScore: 40,
        co2Emission: `${(distance * 0.02).toFixed(2)} kg`,
        isElectric: true,
        isCNG: false,
      })
      vehicles.push({
        vehicle: 'train',
        greenScore: 38,
        co2Emission: `${(distance * 0.03).toFixed(2)} kg`,
        isElectric: true,
        isCNG: false,
      })
    }

    // Sort by green score (highest first)
    return vehicles.sort((a, b) => b.greenScore - a.greenScore)
  }

  const findRoute = async () => {
    if (!startLocation || !endLocation) return;

    setLoading(true);
    setRouteError(false);

    try {
      const routeType = getTomTomRouteType(selectedOptions.type);
      // Use car as default for finding route
      const vehicleType = 'car'

      const url = `https://api.tomtom.com/routing/1/calculateRoute/${startLocation.latitude},${startLocation.longitude}:${endLocation.latitude},${endLocation.longitude}/json?key=${TOMTOM_API_KEY}&routeType=${routeType}&vehicleHeading=90&sectionType=traffic&report=effectiveSettings&routeRepresentation=polyline&computeTravelTimeFor=all&traffic=true&travelMode=${vehicleType}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]

        const coordinates: Location[] = route.legs.flatMap((leg: any) =>
          leg.points.map((point: any) => ({
            latitude: point.latitude,
            longitude: point.longitude,
          }))
        )

        setRouteCoordinates(coordinates)

        const summary = route.summary
        const distanceKm = (summary.lengthInMeters / 1000).toFixed(1)
        const durationMin = Math.round(summary.travelTimeInSeconds / 60)

        // Generate vehicle recommendations based on distance
        const distanceNumber = parseFloat(distanceKm)
        const recommendations = determineRecommendedVehicles(distanceNumber)
        setRecommendedVehicles(recommendations)

        // Set first recommendation as default
        const defaultVehicle = recommendations[0]
        setSelectedVehicle(defaultVehicle)

        setRouteDetails({
          distance: `${distanceKm} km`,
          duration: `${durationMin} mins`,
          co2Emission: defaultVehicle.co2Emission,
          recommendedVehicles: recommendations,
          selectedVehicle: defaultVehicle,
        })

        setRouteInfo(
          `${selectedOptions.type} route (${defaultVehicle.vehicle})`
        )

        const geoJson = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: coordinates.map((coord) => [
                  coord.longitude,
                  coord.latitude,
                ]),
              },
              properties: {},
            },
          ],
        }

        webViewRef.current?.injectJavaScript(
          `displayRoute(${JSON.stringify(geoJson)}); true;`
        )
      } else {
        throw new Error('No route found between these locations')
      }
    } catch (error) {
      console.error('Error finding route:', error)
      setRouteError(true)

      // Set a user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('No route found')) {
          setErrorMessage('No route found between these locations')
        } else {
          setErrorMessage('Unable to calculate a route right now')
        }
      } else {
        setErrorMessage('Something went wrong with route calculation')
      }
    } finally {
      setLoading(false)
      setShowOptions(false)
    }
  }

  const selectVehicle = (vehicle: VehicleRecommendation) => {
    setSelectedVehicle(vehicle)

    if (routeDetails) {
      setRouteDetails({
        ...routeDetails,
        co2Emission: vehicle.co2Emission,
        selectedVehicle: vehicle,
      })
    }

    setRouteInfo(`${selectedOptions.type} route (${vehicle.vehicle})`)
  }

  const saveRouteData = async () => {
    if (
      !isSignedIn ||
      !user ||
      !routeDetails ||
      !startLocation ||
      !endLocation ||
      !selectedVehicle
    )
      return;

    try {
      const distance = parseFloat(routeDetails.distance.replace(' km', ''));
      const userUUID = getUUIDFromClerkID(user.id);
      const greenPoints = selectedVehicle.greenScore;

      const routeData = {
        user_id: userUUID,
        start_lat: startLocation.latitude,
        start_lng: startLocation.longitude,
        end_lat: endLocation.latitude,
        end_lng: endLocation.longitude,
        distance: distance,
        duration: routeDetails.duration,
        co2_emission: parseFloat(selectedVehicle.co2Emission.replace(' kg', '')),
        vehicle_type: selectedVehicle.vehicle,
        route_type: selectedOptions.type,
        green_points: greenPoints,
      };

      await saveRoute(routeData);

      setEarnedPoints(greenPoints);
      setRouteSaved(true);
      setAchievementPoints(greenPoints);
      setShowAchievement(true);

      // Save complete route data to AsyncStorage
      const persistentRouteData = {
        routeSaved: true,
        startLocation,
        endLocation,
        routeDetails,
        selectedVehicle,
        routeInfo,
        earnedPoints: greenPoints,
        routeCoordinates,
        selectedOptions
      };

      await AsyncStorage.setItem('SAVED_ROUTE_DATA', JSON.stringify(persistentRouteData));

      setSavedRouteHistory({
        startLocation,
        endLocation,
        routeDetails,
        selectedVehicle,
        routeInfo,
        earnedPoints: greenPoints
      });
    } catch (error) {
      console.error('Error saving route data:', error);
      Alert.alert(
        'Save Failed',
        'There was an error saving your route data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Restore the resetMapMarkers function which was accidentally removed
  // Function to reset just the map markers without affecting route data
  const resetMapMarkers = () => {
    // Show custom modal instead of default Alert
    setShowResetMarkersModal(true);
  }

  // Function to handle actual reset of map markers
  const handleResetMapMarkers = () => {
    // Make sure the WebView is properly initialized
    if (webViewRef.current) {
      try {
        setStartLocation(null)
        setEndLocation(null)
        // Use the improved clearMarkers function in the WebView
        webViewRef.current.injectJavaScript(
          'try { clearMarkers(); } catch(e) { console.error("Error in clearMarkers:", e); } true;'
        )
        // Hide the modal after reset
        setShowResetMarkersModal(false);
      } catch (error) {
        console.error('Error resetting map markers:', error)
        Alert.alert(
          'Error',
          'Failed to reset map markers. Please try again.'
        )
        setShowResetMarkersModal(false);
      }
    } else {
      Alert.alert(
        'Error',
        'Map is not initialized yet. Please wait a moment and try again.'
      )
      setShowResetMarkersModal(false);
    }
  }

  // Add this function to handle search animation
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    Animated.timing(searchAnimation, {
      toValue: isSearchExpanded ? 0 : 1,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  };

  const collapseSearch = () => {
    setIsSearchExpanded(false);
    Animated.timing(searchAnimation, {
      toValue: 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  };

  // Add this function to handle notifications
  const handleNotificationPress = () => {
    setShowNotifications(true);
    setHasUnreadNotifications(false);

    // Mark all notifications as read
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Modify the routeInfoCard close button handler
  const handleCloseRoute = () => {
    // Just hide the route info card without clearing the route
    setRouteDetails(null);
  };

  // Add notification generation function
  const generateNotifications = () => {
    const newNotifications: Notification[] = [
      {
        id: '1',
        type: 'progress',
        title: '🌱 Green Milestone!',
        message: 'You\'ve saved 5kg of CO₂ this week! Keep up the great work!',
        icon: 'leaf',
        timestamp: new Date(),
        read: false,
      },
      {
        id: '2',
        type: 'suggestion',
        title: '🚲 New Route Suggestion',
        message: 'Try our new eco-friendly bike route to work. It\'s 15% greener!',
        icon: 'bicycle',
        timestamp: new Date(),
        read: false,
      },
      {
        id: '3',
        type: 'achievement',
        title: '🏆 Level Up!',
        message: 'Congratulations! You\'ve reached Green Explorer level!',
        icon: 'trophy',
        timestamp: new Date(),
        read: false,
      },
      {
        id: '4',
        type: 'update',
        title: '✨ New Feature',
        message: 'Check out our new carbon footprint calculator!',
        icon: 'calculator',
        timestamp: new Date(),
        read: false,
      },
    ];

    setNotifications(newNotifications);
    setHasUnreadNotifications(true);
  };

  // Add notification modal
  const renderNotificationModal = () => (
    <Modal
      visible={showNotifications}
      transparent
      animationType="slide"
      onRequestClose={() => setShowNotifications(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.notificationModal}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>Your Updates</Text>
            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.darkGreen} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.notificationList}>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.unreadNotification,
                  ]}
                >
                  <View style={styles.notificationIcon}>
                    <Ionicons
                      name={notification.icon as any}
                      size={24}
                      color={COLORS.warmGreen}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationItemTitle}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationItemMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {notification.timestamp.toLocaleTimeString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyNotifications}>
                <Ionicons name="notifications-off" size={48} color={COLORS.notificationGreen} />
                <Text style={styles.emptyNotificationsText}>No updates yet</Text>
                <Text style={styles.emptyNotificationsSubtext}>
                  Check back later for eco-friendly tips and updates!
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Add this useEffect for notification generation
  useEffect(() => {
    const generateRandomNotification = () => {
      const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: template.type,
        title: template.title,
        message: template.message,
        icon: template.icon,
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [newNotification, ...prev]);
      setHasUnreadNotifications(true);
    };

    // Generate first notification immediately
    generateRandomNotification();

    // Set up timer for notifications every 10 minutes
    const timer = setInterval(generateRandomNotification, 10 * 60 * 1000);
    notificationTimer.current = timer;

    // Cleanup on unmount
    return () => {
      if (notificationTimer.current) {
        clearInterval(notificationTimer.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated Search Container */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            width: searchAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: ['15%', '90%']
            }),
            position: 'absolute',
            top: 40,
            left: 10,
            zIndex: 1,
          }
        ]}
      >
        {isSearchExpanded ? (
          <View style={styles.expandedSearch}>
            <TouchableOpacity onPress={collapseSearch} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.darkGreen} />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder={!startLocation ? "Enter starting point..." : "Enter destination..."}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearchInput}
              autoFocus
            />
          </View>
        ) : (
          <TouchableOpacity onPress={toggleSearch} style={styles.searchIcon}>
            <Ionicons name="search" size={24} color={COLORS.darkGreen} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {isSearchExpanded && renderSearchResults()}

      {/* Notification Icon - Only show when search is not expanded */}
      {!isSearchExpanded && (
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleNotificationPress}
        >
          <View style={styles.notificationIconContainer}>
            <Ionicons
              name="notifications"
              size={24}
              color={hasUnreadNotifications ? COLORS.warmGreen : COLORS.notificationGreen}
            />
            {hasUnreadNotifications && <View style={styles.notificationBadge} />}
          </View>
        </TouchableOpacity>
      )}

      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        geolocationEnabled={true}
        allowFileAccess={true}
        originWhitelist={['*']}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent
          console.warn('WebView error: ', nativeEvent)
        }}
      />

      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
        <Text style={styles.recenterButtonText}>📍</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetMapButton} onPress={resetMapMarkers}>
        <Text style={styles.resetMapButtonText}>🧹</Text>
      </TouchableOpacity>

      {routeCoordinates.length > 0 && (
        <TouchableOpacity
          style={styles.aiButton}
          onPress={getRouteDescription}
          disabled={aiDescriptionLoading}
        >
          {aiDescriptionLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.aiButtonText}>AI</Text>
          )}
        </TouchableOpacity>
      )}

      {routeDetails && routeDetails.recommendedVehicles && (
        <View style={styles.routeInfoCard}>
          <View style={styles.routeInfoHeader}>
            <Text style={styles.routeInfoTitle}>{routeInfo}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseRoute}
            >
              <Ionicons name="close" size={20} color={COLORS.soil} />
            </TouchableOpacity>
          </View>
          <Text style={styles.routeInfoDetail}>
            Distance: {routeDetails.distance}
          </Text>
          <Text style={styles.routeInfoDetail}>
            Time: {routeDetails.duration}
          </Text>
          <Text style={styles.routeInfoDetail}>
            CO₂ Emission: {routeDetails.co2Emission}
          </Text>

          {routeSaved && earnedPoints && (
            <View style={styles.earnedPointsContainer}>
              <Text style={styles.earnedPointsLabel}>Points Earned:</Text>
              <Text style={styles.earnedPointsValue}>+{earnedPoints}</Text>
            </View>
          )}

          <Text style={styles.vehicleOptionsTitle}>Recommended Vehicles:</Text>
          <ScrollView horizontal style={styles.vehicleOptions}>
            {routeDetails.recommendedVehicles.map((vehicle, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.vehicleOption,
                  selectedVehicle?.vehicle === vehicle.vehicle &&
                    styles.selectedVehicleOption,
                  routeSaved && selectedVehicle?.vehicle === vehicle.vehicle &&
                    styles.savedVehicleOption
                ]}
                onPress={() => !routeSaved && selectVehicle(vehicle)}
                disabled={routeSaved}
              >
                <Text style={styles.vehicleEmoji}>
                  {vehicle.vehicle === 'car'
                    ? '🚗'
                    : vehicle.vehicle === 'bike'
                    ? '🏍️'
                    : vehicle.vehicle === 'walk'
                    ? '🚶'
                    : vehicle.vehicle === 'train'
                    ? '🚆'
                    : vehicle.vehicle === 'auto'
                    ? '🛺'
                    : vehicle.vehicle === 'cycle'
                    ? '🚲'
                    : vehicle.vehicle === 'taxi'
                    ? '🚖'
                    : vehicle.vehicle === 'bus'
                    ? '🚌'
                    : vehicle.vehicle === 'metro'
                    ? '🚇'
                    : vehicle.vehicle === 'rickshaw'
                    ? '🛺'
                    : '🚗'}
                </Text>
                <Text style={styles.vehicleName}>{vehicle.vehicle}</Text>
                <View
                  style={[
                    styles.vehicleScoreBadge,
                    {
                      backgroundColor:
                        vehicle.greenScore > 30
                          ? COLORS.leafGreen
                          : vehicle.greenScore > 20
                          ? '#FFA500'
                          : '#FF6347',
                    },
                  ]}
                >
                  <Text style={styles.vehicleScoreText}>
                    +{vehicle.greenScore}
                  </Text>
                </View>
                {vehicle.isElectric && (
                  <View style={styles.vehicleTagBadge}>
                    <Text style={styles.vehicleTagText}>Electric</Text>
                  </View>
                )}
                {vehicle.isCNG && (
                  <View style={styles.vehicleTagBadge}>
                    <Text style={styles.vehicleTagText}>CNG</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.routeButtonsContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={() => setShowResetRouteModal(true)}>
              <Text style={styles.resetButtonText}>Reset Route</Text>
            </TouchableOpacity>

            {isSignedIn && !routeSaved ? (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveRouteData}
              >
                <Text style={styles.saveButtonText}>Save & Earn Points</Text>
              </TouchableOpacity>
            ) : routeSaved ? (
              <View style={styles.savedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.savedIndicatorText}>Route Saved</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.signInButton}>
                <Text style={styles.signInButtonText}>
                  Sign In to Earn Points
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <Modal visible={showOptions} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.enhancedModalContent}>
            <View style={styles.modalHeaderContainer}>
              <View style={styles.modalIconContainer}>
                <Text style={styles.modalHeaderEmoji}>🧭</Text>
              </View>
              <Text style={styles.enhancedModalTitle}>Choose Your Route</Text>
            </View>

            <ScrollView style={styles.optionsScrollView}>
              <Text style={styles.enhancedOptionTitle}>Route Type:</Text>
              {[
                { type: 'fastest', emoji: '⚡', description: 'Get there as quickly as possible' },
                { type: 'cost-effective', emoji: '🍃', description: 'Save fuel and reduce emissions' },
                { type: 'low-traffic', emoji: '🚦', description: 'Avoid congested areas and traffic jams' },
                { type: 'long-drive', emoji: '🏞️', description: 'Enjoy a more scenic journey' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.enhancedOptionButton,
                    selectedOptions.type === option.type && styles.enhancedSelectedOption,
                  ]}
                  onPress={() =>
                    setSelectedOptions({
                      type: option.type as any,
                    })
                  }
                >
                  <View style={styles.optionContentRow}>
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <View style={styles.optionTextContainer}>
                      <Text style={[
                        styles.enhancedOptionText,
                        selectedOptions.type === option.type && styles.enhancedSelectedOptionText
                      ]}>
                        {option.type}
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        selectedOptions.type === option.type && styles.selectedOptionDescription
                      ]}>
                        {option.description}
                      </Text>
                    </View>
                    {selectedOptions.type === option.type && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.white} style={styles.selectedIcon} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.enhancedFindRouteButton}
                  onPress={findRoute}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="navigate" size={20} color="white" style={styles.buttonIcon} />
                      <Text style={styles.enhancedFindRouteButtonText}>Find Route</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.enhancedCancelButton}
                  onPress={() => setShowOptions(false)}
                >
                  <Text style={styles.enhancedCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAIDescription} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.enhancedModalContent}>
            <View style={styles.modalHeaderContainer}>
              <View style={styles.modalIconContainer}>
                <Text style={styles.modalHeaderEmoji}>🤖</Text>
              </View>
              <Text style={styles.enhancedModalTitle}>Route Description</Text>
            </View>

            <ScrollView style={styles.optionsScrollView}>
              <Text style={styles.descriptionText}>{aiRouteDescription}</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.enhancedFindRouteButton}
              onPress={() => setShowAIDescription(false)}
            >
              <Text style={styles.enhancedFindRouteButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error UI */}
      {routeError && (
        <View style={styles.errorCard}>
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorEmoji}>🥺</Text>
          </View>
          <Text style={styles.errorTitle}>Oops! Route Not Found</Text>
          <Text style={styles.errorDescription}>{errorMessage}</Text>
          <Text style={styles.errorSubtext}>
            The locations might be too far apart or not connected by roads
          </Text>
          <TouchableOpacity
            style={styles.tryAgainButton}
            onPress={() => {
              setRouteError(false);
              resetMapMarkers();
            }}
          >
            <Text style={styles.tryAgainButtonText}>Try Another Route</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Achievement Modal */}
      <Modal
        visible={showAchievement}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAchievement(false)}
      >
        <View style={styles.achievementContainer}>
          <View style={styles.achievementCard}>
            <View style={styles.achievementIconRow}>
              <Text style={styles.achievementEmoji}>🌱</Text>
              <Text style={styles.achievementEmoji}>🎉</Text>
              <Text style={styles.achievementEmoji}>🌍</Text>
            </View>

            <Text style={styles.achievementTitle}>Green Points Earned!</Text>

            <View style={styles.pointsContainer}>
              <Text style={styles.pointsValue}>+{achievementPoints}</Text>
              <Text style={styles.pointsLabel}>points</Text>
            </View>

            <Text style={styles.achievementMessage}>
              Thank you for choosing eco-friendly transportation! You're helping to create a greener planet.
            </Text>

            <View style={styles.achievementStatsRow}>
              <View style={styles.achievementStatItem}>
                <Ionicons name="leaf" size={24} color={COLORS.leafGreen} />
                <Text style={styles.achievementStatValue}>
                  {(achievementPoints * 0.05).toFixed(1)} kg
                </Text>
                <Text style={styles.achievementStatLabel}>CO₂ Saved</Text>
              </View>

              <View style={styles.achievementStatItem}>
                <Ionicons name="podium" size={24} color={COLORS.bark} />
                <Text style={styles.achievementStatValue}>+{Math.round(achievementPoints/5)}</Text>
                <Text style={styles.achievementStatLabel}>Rank Points</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.achievementButton}
              onPress={() => setShowAchievement(false)}
            >
              <Text style={styles.achievementButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showResetMarkersModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.resetMarkersModal}>
            <View style={styles.resetMarkersIconContainer}>
              <Text style={styles.resetMarkersEmoji}>🧹 🗺️</Text>
            </View>
            <Text style={styles.resetMarkersTitle}>Clear Map Markers?</Text>
            <Text style={styles.resetMarkersMessage}>
              This will remove all markers from the map, but won't delete any saved routes.
            </Text>
            <View style={styles.resetMarkersButtons}>
              <TouchableOpacity
                style={styles.resetMarkersCancelButton}
                onPress={() => setShowResetMarkersModal(false)}
              >
                <Text style={styles.resetMarkersCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetMarkersConfirmButton}
                onPress={handleResetMapMarkers}
              >
                <Text style={styles.resetMarkersConfirmText}>Clear Markers</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showResetRouteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.resetRouteModal}>
            <View style={styles.resetRouteIconContainer}>
              <Text style={styles.resetRouteEmoji}>🗑️ 🛣️</Text>
            </View>
            <Text style={styles.resetRouteTitle}>Reset Route?</Text>
            <Text style={styles.resetRouteMessage}>
              This will completely remove your current route and delete any saved route data. This action cannot be undone.
            </Text>
            <View style={styles.resetRouteButtons}>
              <TouchableOpacity
                style={styles.resetRouteCancelButton}
                onPress={() => setShowResetRouteModal(false)}
              >
                <Text style={styles.resetRouteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetRouteConfirmButton}
                onPress={handleResetRoute}
              >
                <Text style={styles.resetRouteConfirmText}>Reset Route</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {renderNotificationModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 2,
  },
  expandedSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: COLORS.soil,
  },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'absolute',
    top: 40,
    right: 10,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.notificationBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.notificationGreen,
    shadowColor: COLORS.notificationGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warmGreen,
    borderWidth: 1,
    borderColor: 'white',
    shadowColor: COLORS.warmGreen,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  searchButton: {
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 25,
    height: 45,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchResultsContainer: {
    position: 'absolute',
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    maxHeight: 300,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  searchResultsList: {
    maxHeight: 250,
  },
  searchResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  searchResultAddress: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  closeSearchButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  closeSearchButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recenterButtonText: {
    fontSize: 24,
  },
  resetMapButton: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  resetMapButtonText: {
    fontSize: 24,
  },
  aiButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#4285F4',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aiButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  routeInfoCard: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  routeInfoDetail: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  routeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#22C55E',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  signInButton: {
    backgroundColor: '#3B82F6',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  signInButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  enhancedModalContent: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 5,
    width: '85%',
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  modalHeaderContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.lightestGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: COLORS.leafGreen,
  },
  modalHeaderEmoji: {
    fontSize: 32,
  },
  enhancedModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  optionsScrollView: {
    paddingHorizontal: 15,
  },
  enhancedOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 10,
    color: COLORS.soil,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  enhancedOptionButton: {
    padding: 15,
    marginVertical: 6,
    backgroundColor: '#f7f7f7',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  enhancedSelectedOption: {
    backgroundColor: COLORS.leafGreen,
    borderColor: COLORS.darkGreen,
  },
  optionContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
  },
  enhancedOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    textTransform: 'capitalize',
  },
  enhancedSelectedOptionText: {
    color: 'white',
  },
  optionDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },
  selectedOptionDescription: {
    color: 'rgba(255,255,255,0.8)',
  },
  selectedIcon: {
    marginLeft: 15,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  enhancedFindRouteButton: {
    backgroundColor: COLORS.leafGreen,
    paddingVertical: 16,
    borderRadius: 50,
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 10,
  },
  enhancedFindRouteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  enhancedCancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  enhancedCancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  errorCard: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FFB6C1', // Light pink border
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F5', // Lavender blush
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorEmoji: {
    fontSize: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#777',
    marginBottom: 16,
    textAlign: 'center',
  },
  tryAgainButton: {
    backgroundColor: '#FFB6C1', // Light pink
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    color: '#444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  achievementContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementCard: {
    backgroundColor: COLORS.white,
    width: '85%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  achievementIconRow: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },
  achievementEmoji: {
    fontSize: 40,
    marginHorizontal: 8,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 15,
    textAlign: 'center',
  },
  pointsContainer: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 50,
    height: 100,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.leafGreen,
    marginBottom: 15,
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  pointsLabel: {
    fontSize: 14,
    color: COLORS.soil,
  },
  achievementMessage: {
    fontSize: 16,
    color: COLORS.soil,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  achievementStatsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  achievementStatItem: {
    alignItems: 'center',
    backgroundColor: COLORS.lightestGreen,
    padding: 10,
    borderRadius: 10,
    width: '45%',
  },
  achievementStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 5,
  },
  achievementStatLabel: {
    fontSize: 12,
    color: COLORS.soil,
  },
  achievementButton: {
    backgroundColor: COLORS.leafGreen,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 10,
  },
  achievementButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  resetMarkersModal: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
  },
  resetMarkersIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightestGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.leafGreen,
  },
  resetMarkersEmoji: {
    fontSize: 30,
  },
  resetMarkersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 10,
    textAlign: 'center',
  },
  resetMarkersMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  resetMarkersButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  resetMarkersCancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  resetMarkersCancelText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetMarkersConfirmButton: {
    backgroundColor: COLORS.leafGreen,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flex: 1.5,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  resetMarkersConfirmText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetRouteModal: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  resetRouteIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  resetRouteEmoji: {
    fontSize: 30,
  },
  resetRouteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
    textAlign: 'center',
  },
  resetRouteMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  resetRouteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  resetRouteCancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  resetRouteCancelText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetRouteConfirmButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flex: 1.5,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  resetRouteConfirmText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  vehicleOptionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
    color: COLORS.darkGreen,
  },
  vehicleOptions: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  vehicleOption: {
    width: 90,
    height: 110,
    marginRight: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.paleGreen,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedVehicleOption: {
    borderColor: COLORS.leafGreen,
    borderWidth: 2,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  vehicleEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
    textAlign: 'center',
    marginBottom: 5,
  },
  vehicleScoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  vehicleScoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vehicleTagBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  vehicleTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  earnedPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.paleGreen,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
  },
  earnedPointsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  earnedPointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.leafGreen,
  },
  savedVehicleOption: {
    borderColor: COLORS.leafGreen,
    borderWidth: 2,
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    opacity: 0.9,
  },
  savedIndicator: {
    backgroundColor: COLORS.darkGreen,
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  savedIndicatorText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  descriptionScroll: {
    maxHeight: 300,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiDescriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
    textAlign: 'left',
    padding: 10,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  notificationModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  notificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  notificationList: {
    maxHeight: '80%',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  unreadNotification: {
    backgroundColor: COLORS.notificationBg,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(195, 74, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  notificationItemMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyNotificationsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 16,
  },
  emptyNotificationsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
})
