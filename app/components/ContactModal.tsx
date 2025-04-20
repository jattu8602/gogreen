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

interface ContactModalProps {
  visible: boolean;
  onClose: () => void;
}

const ContactModal = ({ visible, onClose }: ContactModalProps) => {
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
            <Text style={styles.modalTitle}>Contact Us</Text>
            <TouchableOpacity onPress={onClose}>
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
  contactSection: {
    padding: 16,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  contactInfo: {
    marginLeft: 16,
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 4,
  },
  contactSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
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
});

export default ContactModal;