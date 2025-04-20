import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

// Define tree-themed colors to match the rest of the app
const COLORS = {
  primary: '#FF7757', // Coral/orange for primary elements
  secondary: '#FFB74D', // Lighter orange
  background: '#FFF8E7', // Warm cream
  cardBackground: '#FFFFFF',
  text: '#2D3748',
  textLight: '#718096',
  leafGreen: '#22C55E', // Vibrant leaf green for active items
  darkGreen: '#166534', // Darker green for secondary elements
  iconGreen: '#68D391',
  purple: '#7C3AED', // Purple for avatar background
};

// Define a generic user interface instead of using Clerk's type
interface UserInfo {
  id?: string;
  firstName?: string;
  username?: string;
  imageUrl?: string;
}

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserInfo | null;
}

const ProfileModal = ({ visible, onClose, user }: ProfileModalProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.profileModalContainer}>
        {/* Coral Header */}
        <SafeAreaView style={styles.profileHeader}>
          <TouchableOpacity onPress={onClose}>
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
                    <Ionicons name={badge.icon as any} size={24} color={badge.color} />
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
  );
};

const styles = StyleSheet.create({
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
});

export default ProfileModal;