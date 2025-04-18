import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`
const CLOUDINARY_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'gogreen_profiles'

/**
 * Uploads an image to Cloudinary
 * @param uri Image URI
 * @param userId User ID to use in the public_id
 * @returns Object containing the secure URL of the uploaded image
 */
export const uploadImageToCloudinary = async (
  uri: string,
  userId: string
): Promise<{ secure_url: string }> => {
  // Handle platform-specific URI format
  let formattedUri = uri
  if (Platform.OS === 'ios') {
    formattedUri = uri.replace('file://', '')
  }

  try {
    // Convert image to base64
    const base64 = await FileSystem.readAsStringAsync(formattedUri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    const fileType = uri.split('.').pop() || 'jpg'
    const formData = new FormData()

    formData.append('file', `data:image/${fileType};base64,${base64}`)
    formData.append('upload_preset', CLOUDINARY_PRESET)
    formData.append('public_id', `profile-${userId}-${Date.now()}`)

    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Cloudinary upload failed: ${response.status} ${errorText}`
      )
    }

    const data = await response.json()
    return { secure_url: data.secure_url }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    throw error
  }
}
