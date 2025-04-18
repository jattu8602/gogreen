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
} from 'react-native'
import { WebView } from 'react-native-webview'
import * as Location from 'expo-location'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useUser } from '@clerk/clerk-expo'
import { v5 as uuidv5 } from 'uuid'
import { getUUIDFromClerkID } from '@/lib/userService'
import { calculateGreenPoints, saveRoute } from '@/lib/routeService'
import { TOMTOM_API_KEY } from '../../constants/Config'

interface Location {
  latitude: number
  longitude: number
}

interface RouteOption {
  type: 'fastest' | 'cost-effective' | 'low-traffic' | 'long-drive'
}

interface VehicleRecommendation {
  vehicle: 'car' | 'bike' | 'walk' | 'train' | 'auto' | 'cycle' | 'taxi' | 'bus' | 'metro' | 'rickshaw'
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
}

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
  const [recommendedVehicles, setRecommendedVehicles] = useState<VehicleRecommendation[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecommendation | null>(null)
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

  useEffect(() => {
    ;(async () => {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        console.log('Permission to access location was denied')
        return
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
    console.log('Initializing map with coordinates:', latitude, longitude);
    console.log('Using TomTom API key:', TOMTOM_API_KEY);

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

        function initializeMap() {
          console.log('Initializing TomTom map...');
          try {
            map = tt.map({
              key: '${TOMTOM_API_KEY}',
              container: 'map',
              center: [${longitude}, ${latitude}],
              zoom: 13
            });

            map.on('load', function() {
              console.log('Map loaded successfully');
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'mapLoaded'}));
            });

            map.on('error', function(e) {
              console.error('Map error:', e);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapError',
                error: e.error
              }));
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
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapError',
              error: error.message
            }));
          }
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

        function clearRoute() {
          if (routeLayer) {
            map.removeLayer(routeLayer.id);
            map.removeSource(routeLayer.id);
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
        }

        function clearMarkers() {
          if (startMarker) {
            startMarker.remove();
            startMarker = null;
          }

          if (endMarker) {
            endMarker.remove();
            endMarker = null;
          }
        }

        function displayRoute(routeGeoJson) {
          if (routeLayer) {
            map.removeLayer(routeLayer.id);
            map.removeSource(routeLayer.id);
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
        }

        function centerOnLocation(lat, lng, zoom) {
          map.flyTo({
            center: [lng, lat],
            zoom: zoom || 15
          });
        }

        initializeMap();
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
    setStartLocation(null)
    setEndLocation(null)
    setRouteCoordinates([])
    setRouteInfo('')
    setRouteDetails(null)
    setAIRouteDescription('')
    webViewRef.current?.injectJavaScript('clearRoute(); true;')
  }

  // Function to reset just the map markers without affecting route data
  const resetMapMarkers = () => {
    // Show confirmation alert before clearing markers
    Alert.alert(
      'Reset Map Markers',
      'Are you sure you want to remove all markers from the map?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          onPress: () => {
            setStartLocation(null)
            setEndLocation(null)
            // Only clear the markers, but keep the route layer
            webViewRef.current?.injectJavaScript('clearMarkers(); true;')
          },
          style: 'destructive'
        }
      ]
    )
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
        console.log('Map loaded message received from WebView');
        if (userLocation) {
          recenterMap()
        }
      } else if (data.type === 'mapError') {
        console.error('Map error received from WebView:', data.error);
        Alert.alert(
          'Map Error',
          'There was an error loading the map. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error)
    }
  }

  const searchLocation = async () => {
    if (!searchQuery.trim()) return

    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(
          searchQuery
        )}.json?key=${TOMTOM_API_KEY}`
      )

      const data = await response.json()

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results)
        setShowSearchResults(true)
      } else {
        Alert.alert('No Results', 'No locations found for your search')
      }
    } catch (error) {
      console.error('Error searching location:', error)
      Alert.alert('Error', 'Failed to search for locations')
    }
  }

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
      (selectedVehicle?.vehicle === 'car' && routeDetails?.batteryUsage !== 'N/A'
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

  const determineRecommendedVehicles = (distance: number): VehicleRecommendation[] => {
    const vehicles: VehicleRecommendation[] = [];

    // For short distances (less than 3 km)
    if (distance < 3) {
      vehicles.push({
        vehicle: 'walk',
        greenScore: 50,
        co2Emission: '0 kg',
        isElectric: false,
        isCNG: false
      });
      vehicles.push({
        vehicle: 'bike',
        greenScore: 40,
        co2Emission: '0 kg',
        isElectric: false,
        isCNG: false
      });
      vehicles.push({
        vehicle: 'cycle',
        greenScore: 45,
        co2Emission: '0 kg',
        isElectric: false,
        isCNG: false
      });
    }

    // For medium distances (less than 10 km)
    if (distance < 10) {
      vehicles.push({
        vehicle: 'rickshaw',
        greenScore: 30,
        co2Emission: `${(distance * 0.05).toFixed(2)} kg`,
        isElectric: true,
        isCNG: false
      });
      vehicles.push({
        vehicle: 'auto',
        greenScore: 25,
        co2Emission: `${(distance * 0.08).toFixed(2)} kg`,
        isElectric: false,
        isCNG: true
      });
    }

    // For all distances
    vehicles.push({
      vehicle: 'car',
      greenScore: 15,
      co2Emission: `${(distance * 0.12).toFixed(2)} kg`,
      isElectric: true,
      isCNG: false
    });
    vehicles.push({
      vehicle: 'taxi',
      greenScore: 10,
      co2Emission: `${(distance * 0.15).toFixed(2)} kg`,
      isElectric: false,
      isCNG: false
    });

    // For medium and long distances
    if (distance >= 3) {
      vehicles.push({
        vehicle: 'bus',
        greenScore: 35,
        co2Emission: `${(distance * 0.04).toFixed(2)} kg`,
        isElectric: false,
        isCNG: true
      });
    }

    // For longer distances
    if (distance >= 5) {
      vehicles.push({
        vehicle: 'metro',
        greenScore: 40,
        co2Emission: `${(distance * 0.02).toFixed(2)} kg`,
        isElectric: true,
        isCNG: false
      });
      vehicles.push({
        vehicle: 'train',
        greenScore: 38,
        co2Emission: `${(distance * 0.03).toFixed(2)} kg`,
        isElectric: true,
        isCNG: false
      });
    }

    // Sort by green score (highest first)
    return vehicles.sort((a, b) => b.greenScore - a.greenScore);
  }

  const findRoute = async () => {
    setRouteSaved(false)
    if (!startLocation || !endLocation) return

    setLoading(true)

    try {
      const routeType = getTomTomRouteType(selectedOptions.type)
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
        const distanceNumber = parseFloat(distanceKm);
        const recommendations = determineRecommendedVehicles(distanceNumber);
        setRecommendedVehicles(recommendations);

        // Set first recommendation as default
        const defaultVehicle = recommendations[0];
        setSelectedVehicle(defaultVehicle);

        setRouteDetails({
          distance: `${distanceKm} km`,
          duration: `${durationMin} mins`,
          co2Emission: defaultVehicle.co2Emission,
          recommendedVehicles: recommendations,
          selectedVehicle: defaultVehicle
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
        throw new Error('Failed to calculate route')
      }
    } catch (error) {
      console.error('Error finding route:', error)
      Alert.alert(
        'Route Error',
        'Failed to generate route. Please try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setLoading(false)
      setShowOptions(false)
    }
  }

  const selectVehicle = (vehicle: VehicleRecommendation) => {
    setSelectedVehicle(vehicle);

    if (routeDetails) {
      setRouteDetails({
        ...routeDetails,
        co2Emission: vehicle.co2Emission,
        selectedVehicle: vehicle
      });
    }

    setRouteInfo(`${selectedOptions.type} route (${vehicle.vehicle})`);
  }

  const saveRouteData = async () => {
    if (!isSignedIn || !user || !routeDetails || !startLocation || !endLocation || !selectedVehicle)
      return

    try {
      const baselineEmission = 0.2
      const actualEmission = parseFloat(
        routeDetails.co2Emission.replace(' kg', '')
      )
      const distance = parseFloat(routeDetails.distance.replace(' km', ''))

      const userUUID = getUUIDFromClerkID(user.id)

      const greenPoints = selectedVehicle.greenScore;

      const routeData = {
        user_id: userUUID,
        start_lat: startLocation.latitude,
        start_lng: startLocation.longitude,
        end_lat: endLocation.latitude,
        end_lng: endLocation.longitude,
        distance: distance,
        duration: routeDetails.duration,
        co2_emission: actualEmission,
        vehicle_type: selectedVehicle.vehicle,
        route_type: selectedOptions.type,
        green_points: greenPoints,
      }

      await saveRoute(routeData)

      setRouteSaved(true)
      Alert.alert(
        'Route Saved!',
        `You earned ${greenPoints} green points for this eco-friendly route!`,
        [{ text: 'Nice!' }]
      )
    } catch (error) {
      console.error('Error saving route data:', error)
      Alert.alert(
        'Save Failed',
        'There was an error saving your route data. Please try again.',
        [{ text: 'OK' }]
      )
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a location..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchLocation}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {showSearchResults && (
        <View style={styles.searchResultsContainer}>
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
          <TouchableOpacity
            style={styles.closeSearchButton}
            onPress={() => setShowSearchResults(false)}
          >
            <Text style={styles.closeSearchButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
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
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
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
          <Text style={styles.routeInfoTitle}>{routeInfo}</Text>
          <Text style={styles.routeInfoDetail}>
            Distance: {routeDetails.distance}
          </Text>
          <Text style={styles.routeInfoDetail}>
            Time: {routeDetails.duration}
          </Text>
          <Text style={styles.routeInfoDetail}>
            CO₂ Emission: {routeDetails.co2Emission}
          </Text>

          <Text style={styles.vehicleOptionsTitle}>Recommended Vehicles:</Text>
          <ScrollView horizontal style={styles.vehicleOptions}>
            {routeDetails.recommendedVehicles.map((vehicle, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.vehicleOption,
                  selectedVehicle?.vehicle === vehicle.vehicle && styles.selectedVehicleOption
                ]}
                onPress={() => selectVehicle(vehicle)}
              >
                <Text style={styles.vehicleEmoji}>
                  {vehicle.vehicle === 'car' ? '🚗' :
                   vehicle.vehicle === 'bike' ? '🏍️' :
                   vehicle.vehicle === 'walk' ? '🚶' :
                   vehicle.vehicle === 'train' ? '🚆' :
                   vehicle.vehicle === 'auto' ? '🛺' :
                   vehicle.vehicle === 'cycle' ? '🚲' :
                   vehicle.vehicle === 'taxi' ? '🚖' :
                   vehicle.vehicle === 'bus' ? '🚌' :
                   vehicle.vehicle === 'metro' ? '🚇' :
                   vehicle.vehicle === 'rickshaw' ? '🛺' : '🚗'}
                </Text>
                <Text style={styles.vehicleName}>{vehicle.vehicle}</Text>
                <View style={[styles.vehicleScoreBadge, { backgroundColor: vehicle.greenScore > 30 ? COLORS.leafGreen : vehicle.greenScore > 20 ? '#FFA500' : '#FF6347' }]}>
                  <Text style={styles.vehicleScoreText}>+{vehicle.greenScore}</Text>
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
            <TouchableOpacity style={styles.resetButton} onPress={resetRoute}>
              <Text style={styles.resetButtonText}>Reset Route</Text>
            </TouchableOpacity>

            {isSignedIn && !routeSaved && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveRouteData}
              >
                <Text style={styles.saveButtonText}>Save & Earn Points</Text>
              </TouchableOpacity>
            )}

            {!isSignedIn && (
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Route Options</Text>

            <ScrollView>
              <Text style={styles.optionTitle}>Route Type:</Text>
              {['fastest', 'cost-effective', 'low-traffic', 'long-drive'].map(
                (type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      selectedOptions.type === type && styles.selectedOption,
                    ]}
                    onPress={() =>
                      setSelectedOptions({
                        type: type as any,
                      })
                    }
                  >
                    <Text style={styles.optionText}>{type}</Text>
                  </TouchableOpacity>
                )
              )}

              <TouchableOpacity
                style={styles.findRouteButton}
                onPress={findRoute}
                disabled={loading}
              >
                <Text style={styles.findRouteButtonText}>
                  {loading ? 'Finding Route...' : 'Find Route'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowOptions(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAIDescription} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Route Description</Text>
            <ScrollView style={styles.descriptionScroll}>
              <Text style={styles.descriptionText}>{aiRouteDescription}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAIDescription(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 8,
    height: 45,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
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
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 10,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    zIndex: 10,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  routeInfoCard: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  optionButton: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  selectedOption: {
    backgroundColor: '#2196F3',
  },
  optionText: {
    textAlign: 'center',
  },
  findRouteButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  findRouteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  cancelButtonText: {
    textAlign: 'center',
  },
  descriptionScroll: {
    maxHeight: 300,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    marginTop: 15,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
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
})
