const admin = require('firebase-admin')

// Note: firebase-admin should be initialized in index.js or similar
// If not initialized, this will fail. We'll handle initialization there.

/**
 * Verify a Firebase ID token and extract user info.
 * @param {string} idToken - The ID token from Firebase Auth
 * @returns {Promise<{googleId: string, email: string, displayName: string, avatarUrl: string}>}
 */
async function verifyGoogleToken(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    
    return {
      googleId: decodedToken.uid, // Firebase UID
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.email.split('@')[0],
      avatarUrl: decodedToken.picture || null,
    }
  } catch (error) {
    console.error('[Firebase Auth Verify Error]:', error)
    throw new Error('Invalid or expired Firebase token')
  }
}

module.exports = { verifyGoogleToken }
