import React, { useRef, useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { WebView } from 'react-native-webview'
import { useUser } from '@clerk/clerk-expo'
import { getUUIDFromClerkID } from '@/lib/userService'
import { calculateGreenPoints, saveRoute } from '@/lib/routeService'
import { TOMTOM_API_KEY } from '../../constants/Config'
import * as Location from 'expo-location'

interface Location {
  latitude: number
  longitude: number
}

interface RouteOption {
  type: 'fastest' | 'cost-effective' | 'low-traffic' | 'long-drive'
  vehicle: 'car' | 'bike' | 'walk' | 'train' | 'auto' | 'cycle' | 'taxi'
}

interface RouteDetails {
  distance: string
  duration: string
  co2Emission: string
  batteryUsage: string
}

const getTomTomRouteType = (type: string) => {
  switch (type) {
    case 'fastest':
      return 'fastest'
    case 'cost-effective':
      return 'eco'
    case 'low-traffic':
      return 'balanced'
    case 'long-drive':
      return 'shortest'
    default:
      return 'fastest'
  }
}

const getTomTomVehicleType = (vehicle: string) => {
  switch (vehicle) {
    case 'car':
      return 'car'
    case 'bike':
    case 'cycle':
      return 'bicycle'
    case 'walk':
      return 'pedestrian'
    case 'train':
      return 'transit'
    case 'auto':
    case 'taxi':
      return 'taxi'
    default:
      return 'car'
  }
}

export default function MapScreen() {
  const webViewRef = useRef<WebView>(null)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [startLocation, setStartLocation] = useState<Location | null>(null)
  const [endLocation, setEndLocation] = useState<Location | null>(null)
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([])
  const [showOptions, setShowOptions] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<RouteOption>({
    type: 'fastest',
    vehicle: 'car',
  })
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
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" type="text/css" href="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css">
      <style>
        body, html, #map { margin: 0; padding: 0; height: 100%; }
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
          map = tt.map({
            key: '${TOMTOM_API_KEY}',
            container: 'map',
            center: [${longitude}, ${latitude}],
            zoom: 13
          });

          map.on('load', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'mapLoaded'}));
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
        if (userLocation) {
          recenterMap()
        }
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
      `This is a ${selectedOptions.type} route by ${selectedOptions.vehicle}.\n\n` +
      `Distance: ${routeDetails?.distance || 'Unknown'}\n` +
      `Estimated Time: ${routeDetails?.duration || 'Unknown'}\n` +
      `CO₂ Emission: ${routeDetails?.co2Emission || 'Unknown'}\n` +
      (selectedOptions.vehicle === 'car' && routeDetails?.batteryUsage !== 'N/A'
        ? `Battery Usage: ${routeDetails?.batteryUsage}\n\n`
        : '\n') +
      `Plan ahead and drive safely!`

    try {
      const mockDescription =
        `Your ${selectedOptions.type} route by ${selectedOptions.vehicle} will take approximately ${routeDetails?.duration} to travel ${routeDetails?.distance}.\n\n` +
        `Key points on this journey:\n` +
        `• The route follows main roads with moderate traffic\n` +
        `• You may encounter traffic signals at major intersections\n` +
        `• CO₂ emission for this trip is estimated at ${routeDetails?.co2Emission}\n` +
        (selectedOptions.vehicle === 'car'
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
        `• The route is suitable for ${selectedOptions.vehicle} travel`

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

  const findRoute = async () => {
    setRouteSaved(false)
    if (!startLocation || !endLocation) return

    setLoading(true)

    try {
      const routeType = getTomTomRouteType(selectedOptions.type)
      const vehicleType = getTomTomVehicleType(selectedOptions.vehicle)

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

        let co2Factor = 0
        let batteryUsage = 'N/A'

        switch (selectedOptions.vehicle) {
          case 'car':
            co2Factor = 120
            batteryUsage =
              selectedOptions.type === 'fastest'
                ? `${Math.round(Number(distanceKm) * 1.5)}%`
                : `${Math.round(Number(distanceKm) * 1.2)}%`
            break
          case 'bike':
          case 'cycle':
          case 'walk':
            co2Factor = 0
            break
          case 'train':
            co2Factor = 40
            break
          case 'auto':
          case 'taxi':
            co2Factor = 150
            break
          default:
            co2Factor = 100
        }

        const co2Emission = ((Number(distanceKm) * co2Factor) / 1000).toFixed(2)

        setRouteDetails({
          distance: `${distanceKm} km`,
          duration: `${durationMin} mins`,
          co2Emission: `${co2Emission} kg`,
          batteryUsage: batteryUsage,
        })

        setRouteInfo(
          `${selectedOptions.type} route by ${selectedOptions.vehicle}`
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

  const refreshMap = () => {
    setWebViewKey((prevKey) => prevKey + 1)
  }

  const saveRouteData = async () => {
    if (!isSignedIn || !user || !routeDetails || !startLocation || !endLocation)
      return

    try {
      const baselineEmission = 0.2
      const actualEmission = parseFloat(
        routeDetails.co2Emission.replace(' kg', '')
      )
      const distance = parseFloat(routeDetails.distance.replace(' km', ''))

      const userUUID = getUUIDFromClerkID(user.id)

      const greenPoints = calculateGreenPoints(
        distance,
        selectedOptions.vehicle,
        selectedOptions.type
      )

      const routeData = {
        user_id: userUUID,
        start_lat: startLocation.latitude,
        start_lng: startLocation.longitude,
        end_lat: endLocation.latitude,
        end_lng: endLocation.longitude,
        distance: distance,
        duration: routeDetails.duration,
        co2_emission: actualEmission,
        vehicle_type: selectedOptions.vehicle,
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
          placeholder="Search location..."
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
      />

      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
        <Text style={styles.recenterButtonText}>📍</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.refreshButton} onPress={refreshMap}>
        <Text style={styles.refreshButtonText}>🔄</Text>
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

      {routeDetails && (
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
          {selectedOptions.vehicle === 'car' &&
            routeDetails.batteryUsage !== 'N/A' && (
              <Text style={styles.routeInfoDetail}>
                Battery Usage: {routeDetails.batteryUsage}
              </Text>
            )}

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
                        ...selectedOptions,
                        type: type as any,
                      })
                    }
                  >
                    <Text style={styles.optionText}>{type}</Text>
                  </TouchableOpacity>
                )
              )}

              <Text style={styles.optionTitle}>Vehicle Type:</Text>
              {['car', 'bike', 'walk', 'train', 'auto', 'cycle', 'taxi'].map(
                (vehicle) => (
                  <TouchableOpacity
                    key={vehicle}
                    style={[
                      styles.optionButton,
                      selectedOptions.vehicle === vehicle &&
                        styles.selectedOption,
                    ]}
                    onPress={() =>
                      setSelectedOptions({
                        ...selectedOptions,
                        vehicle: vehicle as any,
                      })
                    }
                  >
                    <Text style={styles.optionText}>{vehicle}</Text>
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
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
    flexDirection: 'row',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    maxHeight: 200,
    zIndex: 1,
  },
  searchResultsList: {
    maxHeight: 150,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultName: {
    fontWeight: 'bold',
  },
  searchResultAddress: {
    color: '#666',
    fontSize: 12,
  },
  closeSearchButton: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  closeSearchButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recenterButtonText: {
    fontSize: 20,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  refreshButtonText: {
    fontSize: 20,
  },
  aiButton: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  aiButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  routeInfoCard: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  routeInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  routeInfoDetail: {
    fontSize: 14,
    marginBottom: 5,
  },
  routeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  resetButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  resetButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  signInButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  signInButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
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
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginBottom: 5,
  },
  selectedOption: {
    backgroundColor: '#2196F3',
  },
  optionText: {
    textAlign: 'center',
  },
  findRouteButton: {
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
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
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
})