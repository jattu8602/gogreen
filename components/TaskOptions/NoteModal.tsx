import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ThemedText } from '@/components/ThemedText'

type Note = {
  title: string
  description: string
}

type NoteModalProps = {
  visible: boolean
  onClose: () => void
  onSave: (note: Note) => void
}

const NoteModal = ({ visible, onClose, onSave }: NoteModalProps) => {
  const [note, setNote] = useState<Note>({ title: '', description: '' })

  const handleSave = () => {
    if (!note.title) {
      Alert.alert('Title Required', 'Please enter a title for your note')
      return
    }

    onSave(note)
    setNote({ title: '', description: '' })
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add Note</ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setNote({ title: '', description: '' })
                onClose()
              }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Title"
            value={note.title}
            onChangeText={(text) => setNote({ ...note, title: text })}
          />

          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Description (optional)"
            multiline
            value={note.description}
            onChangeText={(text) => setNote({ ...note, description: text })}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <ThemedText style={styles.saveButtonText}>Save Note</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  notesInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
})

export default NoteModal
