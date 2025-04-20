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
  SafeAreaView,
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
import { LineChart } from 'react-native-chart-kit'

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
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMerchandiseModal, setShowMerchandiseModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const { user } = useUser();
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

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

  // Function to handle sidebar navigation
  const handleNavigation = (section: string) => {
    setShowSidebar(false);
    console.log('Navigating to:', section);
    switch (section) {
      case 'profile':
        setShowProfileModal(true);
        break;
      case 'merchandise':
        setShowMerchandiseModal(true);
        break;
      case 'about':
        console.log('Setting about modal to true');
        setShowAboutModal(true);
        break;
      case 'contact':
        console.log('Setting contact modal to true');
        setShowContactModal(true);
        break;
      case 'support':
        console.log('Setting support modal to true');
        setShowSupportModal(true);
        break;
    }
  };

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
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => setShowSidebar(true)}
            >
              <Text style={styles.avatarText}>
                {user?.firstName?.[0] || user?.username?.[0] || 'A'}
              </Text>
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
                placeholder="Amount per person "
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

      {/* Sidebar Modal */}
      <Modal
        visible={showSidebar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSidebar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sidebar}>
            {/* Profile Section */}
            <View style={styles.sidebarHeader}>
              <View style={styles.profileSection}>
                <View style={styles.largeAvatar}>
                  {user?.imageUrl ? (
                    <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.largeAvatarText}>
                      {user?.firstName?.[0] || user?.username?.[0] || 'A'}
                    </Text>
                  )}
                </View>
                <Text style={styles.profileName}>
                  {user?.fullName || user?.username || 'Guest User'}
                </Text>
                <Text style={styles.profileEmail}>
                  {user?.emailAddresses[0]?.emailAddress || 'No email provided'}
                </Text>
              </View>
            </View>

            {/* Menu Options */}
            <ScrollView style={styles.menuOptions}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('profile')}
              >
                <View style={styles.menuItemContent}>
                  <View style={[styles.menuIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                    <Ionicons name="person" size={24} color={COLORS.leafGreen} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>Your Profile</Text>
                    <Text style={styles.menuDescription}>View and edit your profile details</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('merchandise')}
              >
                <View style={styles.menuItemContent}>
                  <View style={[styles.menuIcon, { backgroundColor: 'rgba(246, 173, 85, 0.1)' }]}>
                    <Ionicons name="shirt" size={24} color={COLORS.iconOrange} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>Eco-Store</Text>
                    <Text style={styles.menuDescription}>Explore eco-friendly products</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('about')}
              >
                <View style={styles.menuItemContent}>
                  <View style={[styles.menuIcon, { backgroundColor: 'rgba(99, 179, 237, 0.1)' }]}>
                    <Ionicons name="information-circle" size={24} color={COLORS.iconBlue} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>About Us</Text>
                    <Text style={styles.menuDescription}>Learn about our mission</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('contact')}
              >
                <View style={styles.menuItemContent}>
                  <View style={[styles.menuIcon, { backgroundColor: 'rgba(104, 211, 145, 0.1)' }]}>
                    <Ionicons name="mail" size={24} color={COLORS.iconGreen} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>Contact Us</Text>
                    <Text style={styles.menuDescription}>Get in touch with our team</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('support')}
              >
                <View style={styles.menuItemContent}>
                  <View style={[styles.menuIcon, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
                    <Ionicons name="help-buoy" size={24} color={COLORS.purple} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>Support</Text>
                    <Text style={styles.menuDescription}>Help and documentation</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeSidebarButton}
              onPress={() => setShowSidebar(false)}
            >
              <Text style={styles.closeSidebarText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.profileModalContainer}>
          {/* Coral Header */}
          <SafeAreaView style={styles.profileHeader}>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.profileHeaderTitle}>Profile</Text>
            <TouchableOpacity>
              <View style={styles.profileHeaderAvatar}>
                <Text style={styles.profileHeaderAvatarText}>
                  {user?.firstName?.[0] || user?.username?.[0] || 'A'}
                </Text>
              </View>
            </TouchableOpacity>
          </SafeAreaView>

          <ScrollView style={styles.profileContent}>
            <Text style={styles.dashboardTitle}>Dashboard</Text>

            {/* Distance Section */}
            <TouchableOpacity
              style={[styles.dataCard, expandedSection === 'distance' && styles.expandedCard]}
              onPress={() => setExpandedSection(expandedSection === 'distance' ? null : 'distance')}
            >
              <View style={styles.dataCardHeader}>
                <View style={styles.dataCardTitle}>
                  <Ionicons name="map-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.dataCardTitleText}>Distance Covered</Text>
                </View>
                <Text style={styles.dataCardValue}>15.7 Km</Text>
              </View>
              {expandedSection === 'distance' && (
                <View style={styles.expandedContent}>
                  <LineChart
                    data={{
                      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                      datasets: [{
                        data: [12, 8, 15, 10, 15.7, 13]
                      }]
                    }}
                    width={Dimensions.get('window').width - 80}
                    height={180}
                    chartConfig={{
                      backgroundColor: '#FFF',
                      backgroundGradientFrom: '#FFF',
                      backgroundGradientTo: '#FFF',
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(255, 119, 87, ${opacity})`,
                      style: {
                        borderRadius: 16
                      }
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* CO2 Emission Section */}
            <TouchableOpacity
              style={[styles.dataCard, expandedSection === 'co2' && styles.expandedCard]}
              onPress={() => setExpandedSection(expandedSection === 'co2' ? null : 'co2')}
            >
              <View style={styles.dataCardHeader}>
                <View style={styles.dataCardTitle}>
                  <MaterialCommunityIcons name="molecule-co2" size={24} color={COLORS.iconGreen} />
                  <Text style={styles.dataCardTitleText}>CO₂ Emission Saved</Text>
                </View>
                <View style={styles.emissionValue}>
                  <Text style={styles.dataCardValue}>45.2 kg</Text>
                </View>
              </View>
              {expandedSection === 'co2' && (
                <View style={styles.expandedContent}>
                  <View style={styles.emissionStats}>
                    <View style={styles.emissionStat}>
                      <Text style={styles.emissionLabel}>This Month</Text>
                      <Text style={styles.emissionAmount}>45.2 kg</Text>
                    </View>
                    <View style={styles.emissionStat}>
                      <Text style={styles.emissionLabel}>Total</Text>
                      <Text style={styles.emissionAmount}>156.8 kg</Text>
                    </View>
                  </View>
                  <View style={styles.emissionProgress}>
                    <Text style={styles.emissionTarget}>Monthly Goal: 50 kg</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '90%' }]} />
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Green Points Section */}
            <TouchableOpacity
              style={[styles.dataCard, expandedSection === 'points' && styles.expandedCard]}
              onPress={() => setExpandedSection(expandedSection === 'points' ? null : 'points')}
            >
              <View style={styles.dataCardHeader}>
                <View style={styles.dataCardTitle}>
                  <Ionicons name="leaf-outline" size={24} color={COLORS.leafGreen} />
                  <Text style={styles.dataCardTitleText}>Green Points</Text>
                </View>
                <Text style={styles.dataCardValue}>2,450</Text>
              </View>
              {expandedSection === 'points' && (
                <View style={styles.expandedContent}>
                  <LineChart
                    data={{
                      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                      datasets: [{
                        data: [1800, 2100, 1950, 2300, 2450, 2200]
                      }]
                    }}
                    width={Dimensions.get('window').width - 80}
                    height={180}
                    chartConfig={{
                      backgroundColor: '#FFF',
                      backgroundGradientFrom: '#FFF',
                      backgroundGradientTo: '#FFF',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                      style: {
                        borderRadius: 16
                      }
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* Badges Section */}
            <View style={styles.badgesSection}>
              <Text style={styles.badgesTitle}>Achievement Badges</Text>
              <Text style={styles.badgesSubtitle}>Complete milestones to claim these badges</Text>

              <View style={styles.badgesGrid}>
                {[
                  { name: 'Footprint Reducer', icon: 'footsteps', color: '#4CAF50' },
                  { name: 'Walk the Change', icon: 'walk', color: '#2196F3' },
                  { name: 'Stride for the Planet', icon: 'footsteps', color: '#9C27B0' },
                  { name: 'Eco-Walker', icon: 'leaf', color: '#009688' },
                  { name: 'Sustainable Steps', icon: 'walk', color: '#FF9800' },
                  { name: 'Carbon Cutter', icon: 'cut', color: '#F44336' },
                  { name: 'Eco-Saver', icon: 'shield', color: '#3F51B5' },
                  { name: 'Climate Hero', icon: 'star', color: '#E91E63' },
                  { name: 'Green Guardian', icon: 'shield-checkmark', color: '#8BC34A' },
                  { name: 'Emission Eliminator', icon: 'trash-bin', color: '#795548' }
                ].map((badge, index) => (
                  <View key={index} style={styles.badgeContainer}>
                    <View style={[styles.badgeIconContainer, { backgroundColor: `${badge.color}20` }]}>
                      <Ionicons name={badge.icon} size={24} color={badge.color} />
                      <View style={styles.unclaimedOverlay}>
                        <Ionicons name="lock-closed" size={12} color="#FFF" />
                      </View>
                    </View>
                    <Text style={styles.badgeName} numberOfLines={2}>{badge.name}</Text>
                    <TouchableOpacity style={styles.claimButton}>
                      <Text style={styles.claimButtonText}>Claim</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Merchandise Modal */}
      <Modal
        visible={showMerchandiseModal}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setShowMerchandiseModal(false)}
      >
        <View style={styles.merchandiseContainer}>
          {/* Header */}
          <SafeAreaView style={styles.merchandiseHeader}>
            <TouchableOpacity onPress={() => setShowMerchandiseModal(false)}>
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.merchandiseHeaderTitle}>Eco Store</Text>
            <View style={styles.coinBalance}>
              <Ionicons name="leaf" size={20} color="#FFF" />
              <Text style={styles.coinBalanceText}>2,450</Text>
            </View>
          </SafeAreaView>

          <ScrollView style={styles.merchandiseContent}>
            {/* Featured Items */}
            <View style={styles.featuredSection}>
              <Text style={styles.sectionTitle}>Featured Items</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                  {
                    id: '1',
                    name: 'Eco-Friendly Backpack',
                    description: 'Made from recycled materials',
                    price: '500',
                    image: require('../../assets/images/backpack.png')
                  },
                  {
                    id: '2',
                    name: 'Solar Charger',
                    description: 'Charge your devices with solar power',
                    price: '750',
                    image: require('../../assets/images/solar-charger.png')
                  },
                  {
                    id: '3',
                    name: 'Bamboo Water Bottle',
                    description: 'Sustainable and durable',
                    price: '300',
                    image: require('../../assets/images/bamboo-bottle.png')
                  }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.featuredItem}
                    onPress={() => setSelectedItem(item)}
                  >
                    <Image source={item.image} style={styles.featuredImage} />
                    <View style={styles.featuredInfo}>
                      <Text style={styles.featuredName}>{item.name}</Text>
                      <Text style={styles.featuredDescription}>{item.description}</Text>
                      <View style={styles.featuredPrice}>
                        <Ionicons name="leaf" size={16} color={COLORS.leafGreen} />
                        <Text style={styles.priceText}>{item.price}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Categories */}
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoriesGrid}>
                {[
                  { name: 'Apparel', icon: 'shirt', color: '#4CAF50' },
                  { name: 'Vouchers', icon: 'gift', color: '#2196F3' },
                  { name: 'Accessories', icon: 'watch', color: '#9C27B0' }
                ].map((category) => (
                  <TouchableOpacity
                    key={category.name}
                    style={styles.categoryItem}
                    onPress={() => setSelectedCategory(category.name)}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                      <Ionicons name={category.icon} size={24} color={category.color} />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Product List */}
            <View style={styles.productsSection}>
              <Text style={styles.sectionTitle}>{selectedCategory || 'All Products'}</Text>
              <View style={styles.productsGrid}>
                {[
                  {
                    id: '4',
                    name: 'Organic Cotton T-Shirt',
                    description: '100% organic cotton, fair trade',
                    price: '400',
                    image: require('../../assets/images/tshirt.png'),
                    category: 'Apparel'
                  },
                  {
                    id: '5',
                    name: 'Local Cafe Voucher',
                    description: '20% off at Green Bean Cafe',
                    price: '200',
                    image: require('../../assets/images/voucher.png'),
                    category: 'Vouchers'
                  },
                  {
                    id: '6',
                    name: 'Recycled Glass Water Bottle',
                    description: 'Made from 100% recycled glass',
                    price: '450',
                    image: require('../../assets/images/bamboo-bottle.png'),
                    category: 'Accessories'
                  }
                ].filter(item => !selectedCategory || item.category === selectedCategory)
                  .map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.productItem}
                      onPress={() => setSelectedItem(item)}
                    >
                      <Image source={item.image} style={styles.productImage} />
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productDescription}>{item.description}</Text>
                        <View style={styles.productPrice}>
                          <Ionicons name="leaf" size={16} color={COLORS.leafGreen} />
                          <Text style={styles.priceText}>{item.price}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Product Detail Modal */}
        <Modal
          visible={!!selectedItem}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedItem(null)}
        >
          <View style={styles.detailModalOverlay}>
            <View style={styles.detailModalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedItem(null)}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>

              <Image source={selectedItem?.image} style={styles.detailImage} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailName}>{selectedItem?.name}</Text>
                <Text style={styles.detailDescription}>{selectedItem?.description}</Text>
                <View style={styles.detailPrice}>
                  <Ionicons name="leaf" size={24} color={COLORS.leafGreen} />
                  <Text style={styles.detailPriceText}>{selectedItem?.price}</Text>
                </View>
                <TouchableOpacity
                  style={styles.redeemButton}
                  onPress={() => handleRedeem(selectedItem)}
                >
                  <Text style={styles.redeemButtonText}>Redeem</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About GoGreen</Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.aboutSection}>
                <Text style={styles.aboutTitle}>Our Mission</Text>
                <Text style={styles.aboutText}>
                  At GoGreen, we're on a mission to transform the way people travel by making sustainable choices accessible and rewarding. Founded in 2022 by a team of environmental enthusiasts and tech innovators, we believe that every journey can be an opportunity to make a positive impact on our planet.
                </Text>

                <Text style={styles.aboutTitle}>What We Do</Text>
                <Text style={styles.aboutText}>
                  • Smart Eco-Routing: Our AI-powered navigation system suggests the most environmentally friendly routes and transportation options{'\n'}
                  • Carbon Footprint Tracking: Real-time calculation of CO2 emissions for every trip{'\n'}
                  • Green Rewards: Earn points for sustainable choices and redeem them for eco-friendly products{'\n'}
                  • Community Impact: Partnering with local businesses to promote sustainable tourism
                </Text>

                <Text style={styles.aboutTitle}>Our Team</Text>
                <Text style={styles.aboutText}>
                  Our diverse team of 25 professionals includes environmental scientists, software engineers, and sustainability experts. We're headquartered in San Francisco with remote team members across 12 countries, united by our passion for sustainable travel.
                </Text>

                <Text style={styles.aboutTitle}>Partnerships</Text>
                <Text style={styles.aboutText}>
                  We collaborate with leading environmental organizations, including the World Wildlife Fund and The Nature Conservancy, to ensure our impact extends beyond individual travel choices.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Contact Modal */}
      <Modal
        visible={showContactModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Us</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.contactSection}>
                <View style={styles.contactMethod}>
                  <Ionicons name="mail" size={24} color={COLORS.leafGreen} />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>Email</Text>
                    <Text style={styles.contactValue}>support@gogreen.eco</Text>
                    <Text style={styles.contactSubtext}>Response time: Within 24 hours</Text>
                  </View>
                </View>

                <View style={styles.contactMethod}>
                  <Ionicons name="call" size={24} color={COLORS.leafGreen} />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text style={styles.contactValue}>+1 (415) 555-0123</Text>
                    <Text style={styles.contactSubtext}>Mon-Fri: 9AM-6PM PST</Text>
                  </View>
                </View>

                <View style={styles.contactMethod}>
                  <Ionicons name="location" size={24} color={COLORS.leafGreen} />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>Headquarters</Text>
                    <Text style={styles.contactValue}>123 Green Street{'\n'}San Francisco, CA 94105</Text>
                    <Text style={styles.contactSubtext}>By appointment only</Text>
                  </View>
                </View>

                <View style={styles.contactMethod}>
                  <Ionicons name="business" size={24} color={COLORS.leafGreen} />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>Partnership Inquiries</Text>
                    <Text style={styles.contactValue}>partners@gogreen.eco</Text>
                    <Text style={styles.contactSubtext}>For business collaborations</Text>
                  </View>
                </View>

                <View style={styles.socialLinks}>
                  <Text style={styles.socialTitle}>Connect With Us</Text>
                  <View style={styles.socialButtons}>
                    <TouchableOpacity style={styles.socialButton}>
                      <Ionicons name="logo-twitter" size={24} color={COLORS.leafGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                      <Ionicons name="logo-instagram" size={24} color={COLORS.leafGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                      <Ionicons name="logo-linkedin" size={24} color={COLORS.leafGreen} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Support Modal */}
      <Modal
        visible={showSupportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Support</Text>
              <TouchableOpacity onPress={() => setShowSupportModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.supportSection}>
                <Text style={styles.supportTitle}>Frequently Asked Questions</Text>
                {[
                  {
                    question: 'How does GoGreen calculate carbon emissions?',
                    answer: 'We use a sophisticated algorithm that considers multiple factors including distance, vehicle type, fuel efficiency, and occupancy rates. Our calculations are based on data from the Environmental Protection Agency and verified by independent environmental consultants.'
                  },
                  {
                    question: 'What makes a route "eco-friendly"?',
                    answer: 'Our eco-friendly routes consider factors like traffic congestion, road conditions, and available public transportation options. We prioritize routes that minimize fuel consumption and emissions while maintaining reasonable travel times.'
                  },
                  {
                    question: 'How are Green Points calculated?',
                    answer: 'Points are awarded based on the environmental impact of your travel choices. For example, walking earns 50 points, cycling 45 points, and public transport 35-40 points. The exact calculation considers distance, time, and the specific mode of transportation.'
                  },
                  {
                    question: 'Can I use GoGreen internationally?',
                    answer: 'Yes! We currently support navigation and eco-routing in over 50 countries. Our database includes public transportation systems, bike-sharing programs, and walking paths in major cities worldwide.'
                  },
                  {
                    question: 'How do I redeem my Green Points?',
                    answer: 'Points can be redeemed in our Eco Store for sustainable products, local business vouchers, or donated to environmental causes. Each redemption option shows the required points and environmental impact.'
                  },
                  {
                    question: 'What are Achievement Badges?',
                    answer: 'Badges are special rewards for completing eco-friendly milestones. You can earn badges like "Footprint Reducer", "Walk the Change", and "Climate Hero" by making sustainable travel choices and reducing your carbon footprint.'
                  },
                  {
                    question: 'How do I claim Achievement Badges?',
                    answer: 'Badges are automatically awarded when you reach specific milestones. For example, walking 100km unlocks the "Eco-Walker" badge, while reducing your carbon emissions by 1 ton earns the "Carbon Cutter" badge.'
                  },
                  {
                    question: 'What are the benefits of earning badges?',
                    answer: 'Badges showcase your environmental commitment and can unlock special rewards, including bonus Green Points, exclusive discounts at eco-friendly businesses, and recognition on the leaderboard.'
                  }
                ].map((faq, index) => (
                  <View key={index} style={styles.faqItem}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                ))}

                <View style={styles.supportOptions}>
                  <Text style={styles.supportOptionsTitle}>Additional Support</Text>
                  <TouchableOpacity style={styles.supportButton}>
                    <Ionicons name="chatbubbles-outline" size={20} color={COLORS.white} />
                    <Text style={styles.supportButtonText}>Live Chat Support</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.supportButton, { backgroundColor: COLORS.primary }]}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.white} />
                    <Text style={styles.supportButtonText}>Email Support</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 40,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
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
    // backgroundColor: 'red',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  modalBody: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: COLORS.white,
    paddingTop: 50,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: COLORS.leafGreen,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  largeAvatarText: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  menuOptions: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  closeSidebarButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  closeSidebarText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  profileModalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  profileHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileHeaderTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
  },
  profileHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderAvatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  profileContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 20,
  },
  dataCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expandedCard: {
    paddingBottom: 24,
  },
  dataCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataCardTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8,
  },
  dataCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emissionValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emissionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    marginBottom: 20,
  },
  emissionStat: {
    alignItems: 'center',
  },
  emissionLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  emissionAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.iconGreen,
  },
  emissionProgress: {
    marginTop: 12,
  },
  emissionTarget: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.iconGreen,
    borderRadius: 4,
  },
  socialLinks: {
    marginTop: 20,
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
    marginBottom: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportSection: {
    padding: 16,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  supportOptions: {
    marginTop: 24,
  },
  supportOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.leafGreen,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  supportButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  badgesSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  badgesTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
  },
  badgesSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  badgeContainer: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  unclaimedOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#718096',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 8,
    height: 32,
  },
  claimButton: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimButtonText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  merchandiseContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  merchandiseHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  merchandiseHeaderTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
  },
  coinBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coinBalanceText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  merchandiseContent: {
    flex: 1,
    padding: 20,
  },
  featuredSection: {
    marginBottom: 24,
  },
  featuredItem: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  featuredInfo: {
    padding: 12,
  },
  featuredName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  featuredPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  categoryItem: {
    alignItems: 'center',
    width: '30%',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748',
  },
  productsSection: {
    marginBottom: 24,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  productItem: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  productPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.leafGreen,
    marginLeft: 4,
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  detailImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  detailInfo: {
    padding: 20,
  },
  detailName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 16,
    lineHeight: 24,
  },
  detailPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailPriceText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.leafGreen,
    marginLeft: 8,
  },
  redeemButton: {
    backgroundColor: COLORS.leafGreen,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  redeemButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contactSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
})
