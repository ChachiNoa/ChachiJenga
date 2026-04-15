const jwt = require('jsonwebtoken')
const { verifyGoogleToken } = require('./googleAuth')
const { createUser, findUserByGoogleId, updateUserLogin } = require('../db/queries')

const JWT_SECRET = process.env.JWT_SECRET || 'chachijenga-dev-secret'
const JWT_EXPIRY = '7d'

/**
 * Authenticate a user via Google ID token.
 * Creates the user if they don't exist, otherwise updates last login.
 * @param {object} db - better-sqlite3 database instance
 * @param {string} googleIdToken - The ID token from Google Sign-In
 * @returns {Promise<{token: string, user: object}>}
 */
async function authenticateWithGoogle(db, googleIdToken) {
  // Verify the Google token
  const googleUser = await verifyGoogleToken(googleIdToken)

  // Find or create user
  let user = findUserByGoogleId(db, googleUser.googleId)

  if (!user) {
    const result = createUser(db, googleUser)
    user = { id: result.lastInsertRowid, ...googleUser, elo: 1000, games_played: 0 }
  } else {
    updateUserLogin(db, user.id)
  }

  // Generate JWT
  const token = generateToken(user)

  return { token, user }
}

/**
 * Generate a JWT for the given user.
 * @param {object} user - User object with at least { id, google_id || googleId }
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      googleId: user.google_id || user.googleId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  )
}

/**
 * Verify and decode a JWT token.
 * @param {string} token - JWT token
 * @returns {object} Decoded payload with userId and googleId
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

module.exports = { authenticateWithGoogle, generateToken, verifyToken }
