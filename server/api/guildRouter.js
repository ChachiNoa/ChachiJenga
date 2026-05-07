const express = require('express')
const { createAuthMiddleware } = require('../auth/authMiddleware')
const queries = require('../db/queries')

function createGuildRouter(db) {
  const router = express.Router()
  const requireAuth = createAuthMiddleware(db)

  // Get guild ranking
  router.get('/ranking', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50
      const ranking = queries.getGuildsRanking(db, limit)
      res.json(ranking)
    } catch (e) {
      console.error('[Guild API - Ranking]', e)
      res.status(500).json({ error: 'Failed to fetch guild ranking' })
    }
  })

  // Create a new guild
  router.post('/', requireAuth, express.json(), (req, res) => {
    try {
      const { name, description, isPublic } = req.body
      if (!name) return res.status(400).json({ error: 'Guild name is required' })

      const user = queries.findUserById(db, req.user.id)
      if (user.guild_id) {
        return res.status(400).json({ error: 'You are already in a guild' })
      }

      const existingGuild = db.prepare('SELECT id FROM guilds WHERE name = ?').get(name)
      if (existingGuild) {
        return res.status(400).json({ error: 'Guild name already exists' })
      }

      // We do it in a transaction
      const createGuildTx = db.transaction(() => {
        const result = queries.createGuild(db, { name, ownerId: req.user.id, description, isPublic })
        queries.joinGuild(db, req.user.id, result.lastInsertRowid)
        return result.lastInsertRowid
      })

      const guildId = createGuildTx()
      res.status(201).json({ success: true, guildId })
    } catch (e) {
      console.error('[Guild API - Create]', e)
      res.status(500).json({ error: 'Failed to create guild' })
    }
  })

  // Get guild details
  router.get('/:id', requireAuth, (req, res) => {
    try {
      const guild = queries.getGuildById(db, req.params.id)
      if (!guild) return res.status(404).json({ error: 'Guild not found' })
      
      const members = queries.getGuildMembers(db, req.params.id)
      res.json({ guild, members })
    } catch (e) {
      console.error('[Guild API - Details]', e)
      res.status(500).json({ error: 'Failed to fetch guild details' })
    }
  })

  // Join a guild
  router.post('/:id/join', requireAuth, (req, res) => {
    try {
      const guild = queries.getGuildById(db, req.params.id)
      if (!guild) return res.status(404).json({ error: 'Guild not found' })

      const user = queries.findUserById(db, req.user.id)
      if (user.guild_id) {
        return res.status(400).json({ error: 'You are already in a guild' })
      }

      const members = queries.getGuildMembers(db, req.params.id)
      if (members.length >= 15) {
        return res.status(400).json({ error: 'Guild is full (Max 15)' })
      }

      if (!guild.isPublic) {
        // Only friends of the owner can join
        const friends = queries.getFriends(db, guild.ownerId)
        const isFriend = friends.some(f => f.userId === req.user.id)
        if (!isFriend && guild.ownerId !== req.user.id) {
          return res.status(403).json({ error: 'This guild is private. You must be friends with the owner.' })
        }
      }

      queries.joinGuild(db, req.user.id, guild.id)
      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Join]', e)
      res.status(500).json({ error: 'Failed to join guild' })
    }
  })

  // Leave a guild
  router.post('/:id/leave', requireAuth, (req, res) => {
    try {
      const user = queries.findUserById(db, req.user.id)
      if (user.guild_id !== parseInt(req.params.id)) {
        return res.status(400).json({ error: 'You are not in this guild' })
      }

      const guild = queries.getGuildById(db, req.params.id)
      if (guild.ownerId === req.user.id) {
        return res.status(400).json({ error: 'Owner cannot leave the guild. Transfer ownership or delete it.' })
      }

      queries.leaveGuild(db, req.user.id)
      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Leave]', e)
      res.status(500).json({ error: 'Failed to leave guild' })
    }
  })

  // Delete a guild
  router.delete('/:id', requireAuth, (req, res) => {
    try {
      const guild = queries.getGuildById(db, req.params.id)
      if (!guild) return res.status(404).json({ error: 'Guild not found' })
      
      if (guild.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Only the owner can delete the guild' })
      }

      queries.deleteGuild(db, req.params.id)
      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Delete]', e)
      res.status(500).json({ error: 'Failed to delete guild' })
    }
  })

  // Edit guild
  router.patch('/:id', requireAuth, express.json(), (req, res) => {
    try {
      const guild = queries.getGuildById(db, req.params.id)
      if (!guild) return res.status(404).json({ error: 'Guild not found' })
      
      if (guild.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Only the owner can edit the guild' })
      }

      const { name, description, isPublic } = req.body
      queries.updateGuild(db, req.params.id, { name, description, isPublic })
      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Edit]', e)
      res.status(500).json({ error: 'Failed to update guild' })
    }
  })

  return router
}

module.exports = { createGuildRouter }
