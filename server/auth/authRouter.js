const express = require('express')
const { authenticateWithGoogle } = require('./authService')

/**
 * Create the auth router.
 * @param {object} db - better-sqlite3 database instance
 * @returns {express.Router}
 */
function createAuthRouter(db) {
  const router = express.Router()

  // POST /auth/google — authenticate with Google ID token
  router.post('/google', async (req, res) => {
    try {
      const { idToken } = req.body

      if (!idToken) {
        return res.status(400).json({ error: 'Missing idToken' })
      }

      const { token, user } = await authenticateWithGoogle(db, idToken)

      res.json({
        token,
        user: {
          id: user.id,
          displayName: user.display_name || user.displayName,
          email: user.email,
          avatarUrl: user.avatar_url || user.avatarUrl,
          elo: user.elo,
          gamesPlayed: user.games_played || 0,
        },
      })
    } catch (error) {
      if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
        return res.status(401).json({ error: 'Invalid or expired Google token' })
      }
      res.status(500).json({ error: 'Authentication failed' })
    }
  })

  return router
}

module.exports = { createAuthRouter }
