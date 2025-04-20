import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define tree-themed colors to match the rest of the app
const COLORS = {
  leafGreen: '#22C55E',
  darkGreen: '#166534',
  textLight: '#718096',
  text: '#2D3748',
};

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

const AboutModal = ({ visible, onClose }: AboutModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>About GoGreen</Text>
            <TouchableOpacity onPress={onClose}>
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
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
  aboutSection: {
    padding: 16,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 16,
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
});

export default AboutModal;