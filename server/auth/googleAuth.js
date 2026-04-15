const { OAuth2Client } = require('google-auth-library')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

/**
 * Verify a Google ID token and extract user info.
 * @param {string} idToken - The ID token from Google Sign-In
 * @returns {Promise<{googleId: string, email: string, displayName: string, avatarUrl: string}>}
 */
async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()

  return {
    googleId: payload.sub,
    email: payload.email,
    displayName: payload.name,
    avatarUrl: payload.picture || null,
  }
}

module.exports = { verifyGoogleToken }
