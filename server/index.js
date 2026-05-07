require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { setupDatabase } = require('./db/setup')
const { createAuthRouter } = require('./auth/authRouter')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors())
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

app.use('/auth', createAuthRouter(db))
app.use('/api/ranking', createRankingRouter(db))
app.use('/api/profile', createProfileRouter(db))
app.use('/api/users', createUsersRouter(db))
app.use('/api/friends', createFriendsRouter(db))
app.use('/api/guilds', createGuildRouter(db))

const { setupMatchmaking } = require('./matchmaking/matchmakingService')

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`)

  setupMatchmaking(io, socket, db)

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`)
  })
})

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`ChachiJenga server running on port ${PORT}`)
})

module.exports = { app, server, io, db }
