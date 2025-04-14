import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Text,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import { ThemedText } from '@/components/ThemedText'

type Document = {
  caption: string
  files: DocumentPicker.DocumentPickerAsset[]
}

type DocumentModalProps = {
  visible: boolean
  onClose: () => void
  onSave: (document: Document) => void
}

const DocumentModal = ({ visible, onClose, onSave }: DocumentModalProps) => {
  const [document, setDocument] = useState<Document>({ caption: '', files: [] })

  const handleSave = () => {
    if (document.files.length === 0) {
      Alert.alert('Document Required', 'Please add at least one document')
      return
    }

    onSave(document)
    setDocument({ caption: '', files: [] })
    onClose()
  }

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      })

      if (!result.canceled) {
        setDocument((prev) => ({
          ...prev,
          files: [...prev.files, ...result.assets],
        }))
      }
    } catch (error) {
      console.error('Error picking document:', error)
      Alert.alert('Error', 'Failed to pick document')
    }
  }

  const removeDocument = (uri: string) => {
    setDocument((prev) => ({
      ...prev,
      files: prev.files.filter((file) => file.uri !== uri),
    }))
  }

  // Get icon name based on file type
  const getFileIcon = (fileInfo: string) => {
    const lowerCaseFileInfo = fileInfo.toLowerCase()

    if (lowerCaseFileInfo.includes('pdf')) {
      return 'document-text-outline'
    }
    if (
      lowerCaseFileInfo.includes('excel') ||
      lowerCaseFileInfo.includes('sheet') ||
      lowerCaseFileInfo.includes('xls')
    ) {
      return 'grid-outline'
    }
    if (
      lowerCaseFileInfo.includes('word') ||
      lowerCaseFileInfo.includes('doc')
    ) {
      return 'document-outline'
    }
    if (
      lowerCaseFileInfo.includes('image') ||
      lowerCaseFileInfo.includes('jpg') ||
      lowerCaseFileInfo.includes('png') ||
      lowerCaseFileInfo.includes('jpeg')
    ) {
      return 'image-outline'
    }
    if (
      lowerCaseFileInfo.includes('presentation') ||
      lowerCaseFileInfo.includes('ppt')
    ) {
      return 'easel-outline'
    }
    if (
      lowerCaseFileInfo.includes('zip') ||
      lowerCaseFileInfo.includes('rar')
    ) {
      return 'archive-outline'
    }

    return 'document-outline'
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add Documents</ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setDocument({ caption: '', files: [] })
                onClose()
              }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickDocument}
            >
              <Ionicons name="document" size={24} color="#666" />
              <ThemedText style={styles.uploadButtonText}>
                Select Documents
              </ThemedText>
            </TouchableOpacity>

            {document.files.length > 0 && (
              <View style={styles.fileListContainer}>
                <ThemedText style={styles.fileListTitle}>
                  Selected Documents ({document.files.length})
                </ThemedText>
                {document.files.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    <View style={styles.fileDetails}>
                      <Ionicons
                        name={getFileIcon(file.mimeType || file.name)}
                        size={24}
                        color="#666"
                      />
                      <ThemedText
                        style={styles.fileName}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {file.name}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeDocument(file.uri)}
                    >
                      <Ionicons name="close-circle" size={22} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TextInput
              style={[styles.input, styles.captionInput]}
              placeholder="Write something (optional)"
              multiline
              value={document.caption}
              onChangeText={(text) =>
                setDocument({ ...document, caption: text })
              }
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: '80%',
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
  scrollView: {
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadButtonText: {
    marginLeft: 8,
    color: '#666',
  },
  fileListContainer: {
    marginBottom: 16,
  },
  fileListTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileName: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  captionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
})

export default DocumentModal
