const crypto = require('crypto');
const { GameRoom } = require('./GameRoom');

const activeRooms = new Map(); // roomId -> GameRoom
const playerToRoom = new Map(); // socketId -> roomId
const disconnectTimeouts = new Map(); // socketId -> timeoutId
const pendingChallenges = new Map(); // challengeId -> { challenger: { socketId, user }, targetUserId, createdAt }

function isPlayerInActiveGame(socketId) {
  if (!playerToRoom.has(socketId)) return false;
  const roomId = playerToRoom.get(socketId);
  const room = activeRooms.get(roomId);
  return room && room.status === 'IN_PROGRESS';
}

function createRoom(io, player1, player2, db) {
  const roomId = crypto.randomUUID();
  const room = new GameRoom(roomId, player1, player2, io, db, {
    onEnd: () => scheduleCleanup(roomId, [player1.socketId, player2.socketId])
  });
  activeRooms.set(roomId, room);
  playerToRoom.set(player1.socketId, roomId);
  playerToRoom.set(player2.socketId, roomId);
  
  // Make sockets join the room
  io.sockets.sockets.get(player1.socketId)?.join(roomId);
  io.sockets.sockets.get(player2.socketId)?.join(roomId);

  room.startGame();
  return roomId;
}

function createFriendlyRoom(io, player1, player2, db) {
  const roomId = crypto.randomUUID();
  const room = new GameRoom(roomId, player1, player2, io, db, { 
    isFriendly: true,
    onEnd: () => scheduleCleanup(roomId, [player1.socketId, player2.socketId])
  });
  activeRooms.set(roomId, room);
  playerToRoom.set(player1.socketId, roomId);
  playerToRoom.set(player2.socketId, roomId);
  
  io.sockets.sockets.get(player1.socketId)?.join(roomId);
  io.sockets.sockets.get(player2.socketId)?.join(roomId);

  room.startGame();
  return roomId;
}

function scheduleCleanup(roomId, socketIds) {
  // Give players 2 minutes to view the summary screen and potentially sync/reconnect
  setTimeout(() => {
    activeRooms.delete(roomId);
    socketIds.forEach(sid => {
      // Only delete if they are still mapped to THIS room
      if (playerToRoom.get(sid) === roomId) {
        playerToRoom.delete(sid);
      }
    });
    console.log(`[GameEvents] Cleaned up room ${roomId}`);
  }, 120000); 
}

// Helper to find a socket by userId (set during 'identify')
function findSocketByUserId(io, userId) {
  for (const [, s] of io.sockets.sockets) {
    if (s.userId === userId) return s;
  }
  return null;
}

let dbInstance = null;

function handleGameEvents(io, socket, db) {
  if (!dbInstance && db) dbInstance = db;
  socket.on('select_piece', ({ layer, pos }) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    const room = activeRooms.get(roomId);
    if (room) {
      const res = room.handleSelectPiece(socket.id, layer, pos);
      if (!res.success) {
         socket.emit('game_error', res.reason);
      }
    }
  });

  socket.on('piece_extracted', ({ layer, pos }) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    const room = activeRooms.get(roomId);
    if (room) {
       room.handlePieceExtracted(socket.id, layer, pos);
    }
  });

  socket.on('forfeit', () => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    const room = activeRooms.get(roomId);
    if (room) {
      room.handleForfeit(socket.id);
      playerToRoom.delete(socket.id);
    }
  });

  socket.on('stroke_point', (data) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit('opponent_stroke', data);
  });

  socket.on('piece_hovered', (data) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit('opponent_piece_hovered', data);
  });

  socket.on('piece_unhovered', () => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit('opponent_piece_unhovered');
  });

  socket.on('stroke_complete', (data) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit('opponent_stroke_complete', data);
  });

  socket.on('drawing_result', (data) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    const room = activeRooms.get(roomId);
    if (room) {
      room.handleDrawingResult(socket.id, data);
    }
  });

  socket.on('phase_update', (data) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit('opponent_phase_update', data);
  });
  
  socket.on('request_phase_sync', () => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit('request_phase_sync');
  });
  
  socket.on('request_sync', () => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    const room = activeRooms.get(roomId);
    if (room && room.status === 'IN_PROGRESS') {
      socket.emit('game_started', {
        tower: room.tower.toJSON(),
        turn: room.players[room.currentTurnIndex].socketId,
        selectionEndTime: room.selectionEndTime,
        activeChallenge: room.activeChallenge,
        scores: room.getLiveScores(),
        players: room.players.map(p => ({ id: p.socketId, name: p.user.name, avatarUrl: p.user.avatarUrl }))
      });
    } else if (room && room.status === 'ENDED') {
      const summary = room.finalSummaryData ? room.finalSummaryData[socket.id] : null;
      socket.emit('game_over', { reason: room.endReason, summary });
    }
  });

  // ─── Friend Challenge (Friendly Match) ──────────────────
  socket.on('send_challenge', ({ targetUserId, user }) => {
    if (!targetUserId || !user) return;
    
    // Check if challenger is already in a game
    if (isPlayerInActiveGame(socket.id)) {
      return socket.emit('challenge_error', 'Ya estás en una partida');
    }

    const challengeId = crypto.randomUUID();
    pendingChallenges.set(challengeId, {
      challenger: { socketId: socket.id, user },
      targetUserId: String(targetUserId),
      createdAt: Date.now()
    });

    // Find the target user's socket
    const targetSocket = findSocketByUserId(io, String(targetUserId));
    if (!targetSocket) {
      pendingChallenges.delete(challengeId);
      return socket.emit('challenge_error', 'El jugador no está conectado');
    }

    // Check if target is already in a game
    if (isPlayerInActiveGame(targetSocket.id)) {
      pendingChallenges.delete(challengeId);
      return socket.emit('challenge_error', 'El jugador está en una partida');
    }

    targetSocket.emit('challenge_received', {
      challengeId,
      challenger: {
        id: user.id,
        name: user.name || user.displayName,
        avatarUrl: user.avatarUrl,
        tag: user.tag,
        elo: user.elo
      }
    });

    socket.emit('challenge_sent', { challengeId });

    // Auto-expire challenge after 30s
    setTimeout(() => {
      if (pendingChallenges.has(challengeId)) {
        pendingChallenges.delete(challengeId);
        socket.emit('challenge_expired', { challengeId });
        targetSocket.emit('challenge_expired', { challengeId });
      }
    }, 30000);
  });

  socket.on('accept_challenge', ({ challengeId, user }) => {
    const challenge = pendingChallenges.get(challengeId);
    if (!challenge) {
      return socket.emit('challenge_error', 'El desafío ya no está disponible');
    }

    pendingChallenges.delete(challengeId);

    const challengerSocket = io.sockets.sockets.get(challenge.challenger.socketId);
    if (!challengerSocket) {
      return socket.emit('challenge_error', 'El retador se ha desconectado');
    }

    // Create the friendly room
    const player1 = {
      socketId: challenge.challenger.socketId,
      user: challenge.challenger.user
    };
    const player2 = {
      socketId: socket.id,
      user: user || { id: challenge.targetUserId, name: 'Player' }
    };

    createFriendlyRoom(io, player1, player2, dbInstance);
  });

  socket.on('reject_challenge', ({ challengeId }) => {
    const challenge = pendingChallenges.get(challengeId);
    if (!challenge) return;
    
    pendingChallenges.delete(challengeId);
    
    const challengerSocket = io.sockets.sockets.get(challenge.challenger.socketId);
    if (challengerSocket) {
      challengerSocket.emit('challenge_rejected', { challengeId });
    }
  });

  socket.on('disconnect', () => {
    const roomId = playerToRoom.get(socket.id);
    if (roomId) {
      const room = activeRooms.get(roomId);
      if (room) {
        if (room.status !== 'ENDED') {
          // Warn opponent
          socket.to(roomId).emit('opponent_disconnected');
          
          const tid = setTimeout(() => {
            // Verify room still exists and wasn't finished
            if (activeRooms.has(roomId)) {
               const r = activeRooms.get(roomId);
               if (r && r.status !== 'ENDED') r.handleForfeit(socket.id);
            }
            playerToRoom.delete(socket.id);
            disconnectTimeouts.delete(socket.id);
          }, 15000); // 15s timeout
          
          disconnectTimeouts.set(socket.id, tid);
        } else {
          // If ended, just clean up
          playerToRoom.delete(socket.id);
        }
      } else {
        playerToRoom.delete(socket.id);
      }
    }
  });

  socket.on('game_reconnect', ({ oldSocketId }) => {
    if (disconnectTimeouts.has(oldSocketId)) {
      clearTimeout(disconnectTimeouts.get(oldSocketId));
      disconnectTimeouts.delete(oldSocketId);
      
      const roomId = playerToRoom.get(oldSocketId);
      if (roomId) {
        playerToRoom.delete(oldSocketId);
        playerToRoom.set(socket.id, roomId);
        
        socket.join(roomId);
        socket.to(roomId).emit('opponent_reconnected');
        
        const room = activeRooms.get(roomId);
        if (room) {
          const p = room.players.find(p => p.socketId === oldSocketId);
          if (p) p.socketId = socket.id;
          
          if (room.getCurrentPlayer().socketId === oldSocketId) {
            room.currentTurnIndex = room.players.indexOf(p);
          }
        }
      }
    }
  });
}

module.exports = { createRoom, createFriendlyRoom, handleGameEvents, activeRooms, playerToRoom };
