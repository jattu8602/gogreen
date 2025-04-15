import React from 'react'
import { StyleSheet, View } from 'react-native'
import MapView from 'react-native-maps'

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        // Define the initial region to display on the map
        initialRegion={{
          latitude: 37.78825, // Change this latitude to your desired location
          longitude: -122.4324, // Change this longitude to your desired location
          latitudeDelta: 0.0922, // Controls zoom level (smaller = more zoomed in)
          longitudeDelta: 0.0421, // Controls zoom level
        }}
      />
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
})
