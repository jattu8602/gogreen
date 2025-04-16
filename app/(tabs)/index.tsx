import React, { useState, useRef, useEffect } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface Location {
  latitude: number
  longitude: number
}

interface RouteOption {
  type: 'fastest' | 'cost-effective' | 'low-traffic' | 'high-traffic'
  vehicle: 'car' | 'bike' | 'walk'
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null)
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
    })()
  }, [])

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent
    if (!startLocation) {
      setStartLocation(coordinate)
    } else if (!endLocation) {
      setEndLocation(coordinate)
      setShowOptions(true)
    }
  }

  const recenterMap = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      })
    }
  }

  const findRoute = async () => {
    if (!startLocation || !endLocation) return

    const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API!)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `Find the best route between two points:
    Start: ${startLocation.latitude}, ${startLocation.longitude}
    End: ${endLocation.latitude}, ${endLocation.longitude}
    Route Type: ${selectedOptions.type}
    Vehicle: ${selectedOptions.vehicle}

    Provide the route coordinates and estimated time/cost.`

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      setRouteInfo(text)

      // Parse the response and set route coordinates
      // This is a simplified version - you'll need to parse the actual response format
      const coordinates =
        text.match(/\[([^\]]+)\]/g)?.map((coord) => {
          const [lat, lng] = coord
            .replace(/[\[\]]/g, '')
            .split(',')
            .map(Number)
          return { latitude: lat, longitude: lng }
        }) || []

      setRouteCoordinates(coordinates)
    } catch (error) {
      console.error('Error finding route:', error)
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
        />
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        onLongPress={handleMapPress}
        initialRegion={
          userLocation
            ? {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }
            : undefined
        }
      >
        {startLocation && (
          <Marker coordinate={startLocation} title="Start" pinColor="green" />
        )}
        {endLocation && (
          <Marker coordinate={endLocation} title="End" pinColor="red" />
        )}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={3}
            strokeColor="#2196F3"
          />
        )}
      </MapView>

      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
        <Text style={styles.recenterButtonText}>📍</Text>
      </TouchableOpacity>

      <Modal visible={showOptions} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Route Options</Text>

            <ScrollView>
              <Text style={styles.optionTitle}>Route Type:</Text>
              {['fastest', 'cost-effective', 'low-traffic', 'high-traffic'].map(
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
              {['car', 'bike', 'walk'].map((vehicle) => (
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
              ))}

              <TouchableOpacity
                style={styles.findRouteButton}
                onPress={() => {
                  findRoute()
                  setShowOptions(false)
                }}
              >
                <Text style={styles.findRouteButtonText}>Find Route</Text>
              </TouchableOpacity>
            </ScrollView>
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
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 20,
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
})
