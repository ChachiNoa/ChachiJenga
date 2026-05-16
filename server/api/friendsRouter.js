const express = require('express')
const { createAuthMiddleware } = require('../auth/authMiddleware')
const queries = require('../db/queries')

function createFriendsRouter(db, isUserOnline = () => false, getUserStatus = () => 'offline') {
  const router = express.Router()
  const requireAuth = createAuthMiddleware(db)

  // Get all accepted friends
  router.get('/', requireAuth, (req, res) => {
    try {
      const friends = queries.getFriends(db, req.user.id)
      const friendsWithOnline = friends.map(f => ({
        ...f,
        online: isUserOnline(f.userId),
        status: getUserStatus(f.userId)
      }))
      res.json(friendsWithOnline)
    } catch (e) {
      console.error('[Friends API - Get]', e)
      res.status(500).json({ error: 'Failed to fetch friends' })
    }
  })

  // Get pending requests received
  router.get('/pending', requireAuth, (req, res) => {
    try {
      const requests = queries.getPendingFriendRequests(db, req.user.id)
      res.json(requests)
    } catch (e) {
      console.error('[Friends API - Pending]', e)
      res.status(500).json({ error: 'Failed to fetch pending requests' })
    }
  })

  // Send a friend request by tag
  router.post('/request', requireAuth, express.json(), (req, res) => {
    try {
      const { tag } = req.body
      if (!tag) return res.status(400).json({ error: 'Tag is required' })

      const formattedTag = tag.startsWith('#') ? tag : `#${tag}`
      
      const targetUser = db.prepare('SELECT id FROM users WHERE tag = ?').get(formattedTag)
      if (!targetUser) return res.status(404).json({ error: 'User not found' })

      if (targetUser.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot send request to yourself' })
      }

      // Check if there is already a friendship or request between these two
      const existing = db.prepare(`
        SELECT * FROM friendships 
        WHERE (requester_id = ? AND addressee_id = ?) 
           OR (requester_id = ? AND addressee_id = ?)
      `).get(req.user.id, targetUser.id, targetUser.id, req.user.id)

      if (existing) {
        if (existing.status === 'accepted') {
          return res.status(400).json({ error: 'Ya sois amigos' })
        }
        if (existing.status === 'pending') {
          return res.status(400).json({ error: 'Ya hay una solicitud pendiente' })
        }
        // If rejected, delete old row so we can re-send
        db.prepare('DELETE FROM friendships WHERE id = ?').run(existing.id)
      }

      queries.sendFriendRequest(db, req.user.id, targetUser.id)
      res.json({ success: true })
    } catch (e) {
      console.error('[Friends API - Request]', e)
      res.status(500).json({ error: 'Failed to send request' })
    }
  })

  // Accept request
  router.post('/:id/accept', requireAuth, (req, res) => {
    try {
      const result = queries.updateFriendRequestStatus(db, req.params.id, req.user.id, 'accepted')
      if (result.changes === 0) return res.status(404).json({ error: 'Request not found' })
      res.json({ success: true })
    } catch (e) {
      console.error('[Friends API - Accept]', e)
      res.status(500).json({ error: 'Failed to accept request' })
    }
  })

  // Reject request
  router.post('/:id/reject', requireAuth, (req, res) => {
    try {
      const result = queries.updateFriendRequestStatus(db, req.params.id, req.user.id, 'rejected')
      if (result.changes === 0) return res.status(404).json({ error: 'Request not found' })
      res.json({ success: true })
    } catch (e) {
      console.error('[Friends API - Reject]', e)
      res.status(500).json({ error: 'Failed to reject request' })
    }
  })

  // Delete friendship
  router.delete('/:id', requireAuth, (req, res) => {
    try {
      const result = queries.deleteFriendship(db, req.params.id, req.user.id)
      if (result.changes === 0) return res.status(404).json({ error: 'Friendship not found' })
      res.json({ success: true })
    } catch (e) {
      console.error('[Friends API - Delete]', e)
      res.status(500).json({ error: 'Failed to delete friendship' })
    }
  })

  return router
}

module.exports = { createFriendsRouter }
