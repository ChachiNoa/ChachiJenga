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

  // Get pending invitations for the current user
  router.get('/invitations/pending', requireAuth, (req, res) => {
    try {
      const invitations = queries.getPendingGuildInvitations(db, req.user.id)
      res.json(invitations)
    } catch (e) {
      console.error('[Guild API - Invitations]', e)
      res.status(500).json({ error: 'Failed to fetch pending invitations' })
    }
  })

  // Accept guild invitation
  router.post('/invitations/:invitationId/accept', requireAuth, (req, res) => {
    try {
      const invitation = queries.getGuildInvitationById(db, req.params.invitationId)
      if (!invitation || invitation.invitee_id !== req.user.id || invitation.status !== 'pending') {
        return res.status(404).json({ error: 'Invitation not found or no longer valid' })
      }

      // Check if user is already in a guild
      const user = queries.findUserById(db, req.user.id)
      if (user.guild_id) {
        return res.status(400).json({ error: 'You are already in a guild' })
      }

      // Check guild limits
      const members = queries.getGuildMembers(db, invitation.guild_id)
      if (members.length >= 15) {
        return res.status(400).json({ error: 'Guild is full (Max 15)' })
      }

      const tx = db.transaction(() => {
        queries.respondGuildInvitation(db, req.params.invitationId, req.user.id, 'accepted')
        queries.joinGuild(db, req.user.id, invitation.guild_id)
      })
      tx()

      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Accept Invite]', e)
      res.status(500).json({ error: 'Failed to accept invitation' })
    }
  })

  // Reject guild invitation
  router.post('/invitations/:invitationId/reject', requireAuth, (req, res) => {
    try {
      const result = queries.respondGuildInvitation(db, req.params.invitationId, req.user.id, 'rejected')
      if (result.changes === 0) return res.status(404).json({ error: 'Invitation not found' })
      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Reject Invite]', e)
      res.status(500).json({ error: 'Failed to reject invitation' })
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

  // Invite user to guild
  router.post('/:id/invite/:userId', requireAuth, (req, res) => {
    try {
      const guild = queries.getGuildById(db, req.params.id)
      if (!guild) return res.status(404).json({ error: 'Guild not found' })

      const inviterId = req.user.id
      const inviteeId = parseInt(req.params.userId)

      if (inviterId === inviteeId) {
        return res.status(400).json({ error: 'You cannot invite yourself' })
      }

      const inviter = queries.findUserById(db, inviterId)
      if (inviter.guild_id !== guild.id) {
        return res.status(403).json({ error: 'You are not in this guild' })
      }

      // Check permission: anyone can invite if public, else only admin/owner
      if (!guild.isPublic && guild.ownerId !== inviterId && inviter.guild_role !== 'admin') {
        return res.status(403).json({ error: 'Only admins or owner can invite to a private guild' })
      }

      const invitee = queries.findUserById(db, inviteeId)
      if (!invitee) return res.status(404).json({ error: 'User not found' })
      if (invitee.guild_id === guild.id) {
        return res.status(400).json({ error: 'User is already in this guild' })
      }

      const existingInvites = queries.getPendingGuildInvitations(db, inviteeId)
      if (existingInvites.some(i => i.guildId === guild.id)) {
        return res.status(400).json({ error: 'User already has a pending invitation to this guild' })
      }

      queries.createGuildInvitation(db, guild.id, inviterId, inviteeId)
      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Invite]', e)
      res.status(500).json({ error: 'Failed to send invitation' })
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

  // Edit guild (owner or admin)
  router.patch('/:id', requireAuth, express.json(), (req, res) => {
    try {
      const guild = queries.getGuildById(db, req.params.id)
      if (!guild) return res.status(404).json({ error: 'Guild not found' })
      
      const user = queries.findUserById(db, req.user.id)
      const isOwner = guild.ownerId === req.user.id
      const isAdmin = user.guild_role === 'admin' && user.guild_id === parseInt(req.params.id)
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only the owner or admins can edit the guild' })
      }

      const { name, description, isPublic } = req.body
      queries.updateGuild(db, req.params.id, { name, description, isPublic })
      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Edit]', e)
      res.status(500).json({ error: 'Failed to update guild' })
    }
  })

  // Kick a member from guild
  router.post('/:id/kick/:userId', requireAuth, (req, res) => {
    try {
      const guild = queries.getGuildById(db, req.params.id)
      if (!guild) return res.status(404).json({ error: 'Guild not found' })

      const targetId = parseInt(req.params.userId)
      if (targetId === req.user.id) return res.status(400).json({ error: 'Cannot kick yourself' })

      const isOwner = guild.ownerId === req.user.id
      const caller = queries.findUserById(db, req.user.id)
      const isAdmin = caller.guild_role === 'admin' && caller.guild_id === guild.id

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only owner or admins can kick members' })
      }

      const target = queries.findUserById(db, targetId)
      if (!target || target.guild_id !== guild.id) {
        return res.status(400).json({ error: 'User is not in this guild' })
      }

      // Admins cannot kick other admins
      if (isAdmin && !isOwner && target.guild_role === 'admin') {
        return res.status(403).json({ error: 'Admins cannot kick other admins' })
      }

      queries.kickFromGuild(db, targetId)
      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Kick]', e)
      res.status(500).json({ error: 'Failed to kick member' })
    }
  })

  // Promote member to admin (owner only)
  router.post('/:id/promote/:userId', requireAuth, (req, res) => {
    try {
      const guild = queries.getGuildById(db, req.params.id)
      if (!guild) return res.status(404).json({ error: 'Guild not found' })
      if (guild.ownerId !== req.user.id) return res.status(403).json({ error: 'Only the owner can promote members' })

      const target = queries.findUserById(db, parseInt(req.params.userId))
      if (!target || target.guild_id !== guild.id) return res.status(400).json({ error: 'User is not in this guild' })

      queries.setGuildRole(db, target.id, 'admin')
      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Promote]', e)
      res.status(500).json({ error: 'Failed to promote member' })
    }
  })

  // Demote admin to member (owner only)
  router.post('/:id/demote/:userId', requireAuth, (req, res) => {
    try {
      const guild = queries.getGuildById(db, req.params.id)
      if (!guild) return res.status(404).json({ error: 'Guild not found' })
      if (guild.ownerId !== req.user.id) return res.status(403).json({ error: 'Only the owner can demote admins' })

      const target = queries.findUserById(db, parseInt(req.params.userId))
      if (!target || target.guild_id !== guild.id) return res.status(400).json({ error: 'User is not in this guild' })

      queries.setGuildRole(db, target.id, 'member')
      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Demote]', e)
      res.status(500).json({ error: 'Failed to demote member' })
    }
  })

  // Transfer ownership (owner only)
  router.post('/:id/transfer/:userId', requireAuth, (req, res) => {
    try {
      const guild = queries.getGuildById(db, req.params.id)
      if (!guild) return res.status(404).json({ error: 'Guild not found' })
      if (guild.ownerId !== req.user.id) return res.status(403).json({ error: 'Only the owner can transfer ownership' })

      const newOwnerId = parseInt(req.params.userId)
      const target = queries.findUserById(db, newOwnerId)
      if (!target || target.guild_id !== guild.id) return res.status(400).json({ error: 'User is not in this guild' })

      queries.transferGuildOwnership(db, guild.id, newOwnerId)
      res.json({ success: true })
    } catch (e) {
      console.error('[Guild API - Transfer]', e)
      res.status(500).json({ error: 'Failed to transfer ownership' })
    }
  })

  return router
}

module.exports = { createGuildRouter }
