const { verifyToken } = require('./authService')
const { findUserById } = require('../db/queries')

/**
 * Express middleware to authenticate requests via JWT.
 * Sets req.user with the authenticated user's data.
 * @param {object} db - better-sqlite3 database instance
 * @returns {Function} Express middleware
 */
function createAuthMiddleware(db) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.split(' ')[1]

    try {
      const decoded = verifyToken(token)
      const user = findUserById(db, decoded.userId)

      if (!user) {
        return res.status(401).json({ error: 'User not found' })
      }

      req.user = user
      next()
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' })
      }
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
}

module.exports = { createAuthMiddleware }
