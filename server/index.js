require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { setupDatabase } = require('./db/setup')
const admin = require('firebase-admin')

// Initialize Firebase Admin with service account credentials (Railway) or project ID only (dev)
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'chachijenga-545c7'
}

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    firebaseConfig.credential = admin.credential.cert(serviceAccount)
    console.log('[Firebase] Initialized with service account credentials')
  } catch (e) {
    console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT:', e.message)
  }
} else {
  console.log('[Firebase] No service account found, using project ID only (dev mode)')
}

admin.initializeApp(firebaseConfig)
const { createAuthRouter } = require('./auth/authRouter')

const app = express()
const server = http.createServer(app)
const allowedOrigins = [
  'http://localhost:5173',
  'https://chachijenga-545c7.web.app',
  'https://chachijenga-545c7.firebaseapp.com',
  process.env.CLIENT_URL
].filter(Boolean)

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
})

// Middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))
app.use(express.json())

// Initialize database
const db = setupDatabase()

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const { createRankingRouter } = require('./api/rankingRouter')
const { createProfileRouter } = require('./api/profileRouter')
const { createUsersRouter } = require('./api/usersRouter')
const { createFriendsRouter } = require('./api/friendsRouter')
const { createGuildRouter } = require('./api/guildRouter')

const onlineUsers = new Set()
const isUserOnline = (userId) => onlineUsers.has(String(userId))

// We need playerToRoom from gameEvents to check if a user is in a game
// This will be available after require below
const { playerToRoom, activeRooms } = require('./game/gameEvents')

function getUserStatus(userId) {
  const strId = String(userId)
  if (!onlineUsers.has(strId)) return 'offline'
  // Check if any connected socket with this userId is in an ACTIVE game room
  if (io) {
    for (const [, s] of io.sockets.sockets) {
      if (s.userId === strId && playerToRoom.has(s.id)) {
        const roomId = playerToRoom.get(s.id)
        const room = activeRooms.get(roomId)
        if (room && room.status === 'IN_PROGRESS') {
          return 'in_game'
        }
      }
    }
  }
  return 'online'
}

app.use('/auth', createAuthRouter(db))
app.use('/api/ranking', createRankingRouter(db))
app.use('/api/profile', createProfileRouter(db))
app.use('/api/users', createUsersRouter(db))
app.use('/api/friends', createFriendsRouter(db, isUserOnline, getUserStatus))
app.use('/api/guilds', createGuildRouter(db))

const { setupMatchmaking } = require('./matchmaking/matchmakingService')

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`)

  socket.on('identify', (userId) => {
    if (userId) {
      const strId = String(userId)
      socket.userId = strId
      onlineUsers.add(strId)
      console.log(`[Socket] User identified: ${strId} (Total online: ${onlineUsers.size})`)
    }
  })

  setupMatchmaking(io, socket, db)

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`)
    if (socket.userId) {
      // In a real app, you'd count connections per user to avoid removing if they have multiple tabs
      // For simplicity, we just remove them here
      onlineUsers.delete(socket.userId)
    }
  })
})

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`ChachiJenga server running on port ${PORT}`)
})

module.exports = { app, server, io, db, isUserOnline }
