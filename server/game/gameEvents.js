const crypto = require('crypto');
const { GameRoom } = require('./GameRoom');

const activeRooms = new Map(); // roomId -> GameRoom
const playerToRoom = new Map(); // socketId -> roomId
const disconnectTimeouts = new Map(); // socketId -> timeoutId

function createRoom(io, player1, player2, db) {
  const roomId = crypto.randomUUID();
  const room = new GameRoom(roomId, player1, player2, io, db);
  activeRooms.set(roomId, room);
  playerToRoom.set(player1.socketId, roomId);
  playerToRoom.set(player2.socketId, roomId);
  
  // Make sockets join the room
  io.sockets.sockets.get(player1.socketId)?.join(roomId);
  io.sockets.sockets.get(player2.socketId)?.join(roomId);

  room.startGame();
  return roomId;
}

function handleGameEvents(io, socket) {
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
  
  socket.on('request_sync', () => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    const room = activeRooms.get(roomId);
    if (room && room.status === 'IN_PROGRESS') {
      socket.emit('game_started', {
        tower: room.tower.toJSON(),
        turn: room.players[room.currentTurnIndex].socketId
      });
    }
  });

  socket.on('disconnect', () => {
    const roomId = playerToRoom.get(socket.id);
    if (roomId) {
      const room = activeRooms.get(roomId);
      if (room) {
        // Warn opponent
        socket.to(roomId).emit('opponent_disconnected');
        
        const tid = setTimeout(() => {
          // Verify room still exists and wasn't finished
          if (activeRooms.has(roomId)) {
             room.handleForfeit(socket.id);
          }
          playerToRoom.delete(socket.id);
          disconnectTimeouts.delete(socket.id);
        }, 30000); // 30s timeout
        
        disconnectTimeouts.set(socket.id, tid);
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

module.exports = { createRoom, handleGameEvents, activeRooms, playerToRoom };
