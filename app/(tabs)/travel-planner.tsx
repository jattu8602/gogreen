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
// Import our new modal components
import {
  ProfileModal,
  EcoStoreModal,
  AboutModal,
  ContactModal,
  SupportModal
} from '../components'

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

      {/* Replace modals with new component imports */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />

      <EcoStoreModal
        visible={showMerchandiseModal}
        onClose={() => setShowMerchandiseModal(false)}
        userPoints={2450} // Pass actual user points here
      />

      <AboutModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      <ContactModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
      />

      <SupportModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
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
  contactSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
})
