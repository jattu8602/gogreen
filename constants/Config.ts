// TomTom API key configuration
// For proper security, this should come from environment variables
// For development, we're using a hardcoded key, but in production this should be secured

// Try to get API key from environment variables if available
const envApiKey = process.env.TOMTOM_API_KEY || process.env.EXPO_PUBLIC_TOMTOM_API_KEY;

// Fallback to hardcoded key only for development
const hardcodedKey = 'JfGEY97rCJsxiAdjfv8xAEcvwxaJQGg7';

// Use environment variable if available, otherwise use hardcoded key
export const TOMTOM_API_KEY = envApiKey || hardcodedKey;

// Provide a simple validation check that can be used for debugging
export const isTomTomKeyValid = () => {
  return TOMTOM_API_KEY &&
         TOMTOM_API_KEY.length > 10 &&
         TOMTOM_API_KEY !== 'undefined' &&
         TOMTOM_API_KEY !== 'YOUR_API_KEY_HERE';
};

// For debugging - log a warning if the key doesn't seem valid
if (!isTomTomKeyValid()) {
  console.warn('⚠️ TomTom API key may be invalid or missing. Please check your configuration.');
}