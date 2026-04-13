require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { setupDatabase } = require('./db/setup')

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`)

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
