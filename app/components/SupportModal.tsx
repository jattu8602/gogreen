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
  primary: '#FF7757',
  purple: '#7C3AED',
  white: '#FFFFFF',
};

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

// FAQ item interface
interface FAQ {
  question: string;
  answer: string;
}

const SupportModal = ({ visible, onClose }: SupportModalProps) => {
  // FAQ data
  const faqs: FAQ[] = [
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
  ];

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
            <Text style={styles.modalTitle}>Support</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.supportSection}>
              <Text style={styles.supportTitle}>Frequently Asked Questions</Text>
              {faqs.map((faq, index) => (
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
    marginTop: 12,
  },
  supportButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SupportModal;