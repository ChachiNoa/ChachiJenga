const express = require('express')
const { createAuthMiddleware } = require('../auth/authMiddleware')

function createUsersRouter(db) {
  const router = express.Router()
  const requireAuth = createAuthMiddleware(db)

  router.get('/search', requireAuth, (req, res) => {
    const { tag } = req.query
    if (!tag) {
      return res.status(400).json({ error: 'Tag parameter is required' })
    }

    // Ensure the tag starts with #
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`

    const stmt = db.prepare('SELECT id, display_name as displayName, tag, avatar_url as avatarUrl, elo FROM users WHERE tag = ?')
    const user = stmt.get(formattedTag)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  })

  return router
}

module.exports = { createUsersRouter }
