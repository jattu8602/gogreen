// Android build helper functions
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Ensures the Android directory exists and has the correct configurations
 */
function prepareAndroidBuild() {
  console.log('Preparing Android build environment...')

  // Make sure the android directory exists
  if (!fs.existsSync('android')) {
    console.log('Creating android directory...')
    fs.mkdirSync('android', { recursive: true })
  }

  // Copy custom build.gradle if it exists
  if (fs.existsSync('android-build.gradle')) {
    console.log('Copying custom build.gradle to android directory...')
    fs.copyFileSync(
      'android-build.gradle',
      path.join('android', 'build.gradle')
    )
  }

  // Copy gradle.properties if it exists
  if (fs.existsSync('gradle.properties')) {
    console.log('Copying gradle.properties to android directory...')
    fs.copyFileSync(
      'gradle.properties',
      path.join('android', 'gradle.properties')
    )
  }

  console.log('Android build environment prepared successfully!')
}

// If this script is run directly, execute the function
if (require.main === module) {
  prepareAndroidBuild()
}

module.exports = {
  prepareAndroidBuild,
}
