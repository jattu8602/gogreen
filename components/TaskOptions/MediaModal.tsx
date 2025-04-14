import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { ThemedText } from '@/components/ThemedText'

type Media = {
  caption: string
  assets: ImagePicker.ImagePickerAsset[]
}

type MediaModalProps = {
  visible: boolean
  onClose: () => void
  onSave: (media: Media) => void
}

const MediaModal = ({ visible, onClose, onSave }: MediaModalProps) => {
  const [media, setMedia] = useState<Media>({ caption: '', assets: [] })

  const handleSave = () => {
    if (media.assets.length === 0) {
      Alert.alert('Media Required', 'Please add at least one photo or video')
      return
    }

    onSave(media)
    setMedia({ caption: '', assets: [] })
    onClose()
  }

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'We need camera roll permission to upload photos and videos'
      )
      return
    }

    // Pick the images/videos
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      setMedia((prev) => ({
        ...prev,
        assets: [...prev.assets, ...result.assets],
      }))
    }
  }

  const takePhoto = async () => {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'We need camera permission to take photos'
      )
      return
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
    })

    if (!result.canceled) {
      setMedia((prev) => ({
        ...prev,
        assets: [...prev.assets, ...result.assets],
      }))
    }
  }

  const removeMedia = (uri: string) => {
    setMedia((prev) => ({
      ...prev,
      assets: prev.assets.filter((asset) => asset.uri !== uri),
    }))
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add Photos/Videos</ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setMedia({ caption: '', assets: [] })
                onClose()
              }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color="#666" />
                <ThemedText style={styles.uploadButtonText}>
                  Take Photo/Video
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="images" size={24} color="#666" />
                <ThemedText style={styles.uploadButtonText}>
                  Upload from Gallery
                </ThemedText>
              </TouchableOpacity>
            </View>

            {media.assets.length > 0 && (
              <View style={styles.previewContainer}>
                <ThemedText style={styles.previewTitle}>
                  Selected Media ({media.assets.length})
                </ThemedText>
                <ScrollView horizontal style={styles.previewScroll}>
                  {media.assets.map((asset, index) => (
                    <View key={index} style={styles.previewItem}>
                      <Image
                        source={{ uri: asset.uri }}
                        style={styles.previewImage}
                      />
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeMedia(asset.uri)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#FF3B30"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <TextInput
              style={[styles.input, styles.captionInput]}
              placeholder="Write something (optional)"
              multiline
              value={media.caption}
              onChangeText={(text) => setMedia({ ...media, caption: text })}
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
  buttonsContainer: {
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadButtonText: {
    marginLeft: 8,
    color: '#666',
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  previewScroll: {
    flexDirection: 'row',
  },
  previewItem: {
    position: 'relative',
    marginRight: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
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
    backgroundColor: '#FFD60A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
})

export default MediaModal
