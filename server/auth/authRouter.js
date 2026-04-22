const express = require('express')
const { authenticateWithGoogle, generateToken } = require('./authService')
const { createUser, findUserByGoogleId, updateUserLogin } = require('../db/queries')

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

  // POST /auth/dev-login — DEV ONLY: create/login as a test user without Google
  // Only available when GOOGLE_CLIENT_ID is not configured
  router.post('/dev-login', (req, res) => {
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    if (googleClientId && googleClientId !== 'your-google-client-id-here') {
      return res.status(403).json({ error: 'Dev login disabled in production' })
    }

    try {
      const { name } = req.body
      const devName = name || 'Dev Player'
      const devGoogleId = `dev-${devName.toLowerCase().replace(/\s+/g, '-')}`
      const devEmail = `${devGoogleId}@chachijenga.local`

      let user = findUserByGoogleId(db, devGoogleId)

      if (!user) {
        const result = createUser(db, {
          googleId: devGoogleId,
          displayName: devName,
          email: devEmail,
          avatarUrl: null,
        })
        user = {
          id: result.lastInsertRowid,
          google_id: devGoogleId,
          display_name: devName,
          email: devEmail,
          elo: 1000,
          games_played: 0,
          games_won: 0,
          games_lost: 0,
          games_drawn: 0,
          pieces_extracted: 0,
          shapes_drawn: 0,
        }
      } else {
        updateUserLogin(db, user.id)
      }

      const token = generateToken(user)

      res.json({
        token,
        user: {
          id: user.id,
          displayName: user.display_name || devName,
          email: user.email || devEmail,
          avatarUrl: user.avatar_url || null,
          elo: user.elo || 1000,
          gamesPlayed: user.games_played || 0,
          gamesWon: user.games_won || 0,
          gamesLost: user.games_lost || 0,
          piecesExtracted: user.pieces_extracted || 0,
          shapesDrawn: user.shapes_drawn || 0,
        },
      })
    } catch (error) {
      console.error('[Dev Login Error]', error)
      res.status(500).json({ error: 'Dev login failed' })
    }
  })

  return router
}

module.exports = { createAuthRouter }

