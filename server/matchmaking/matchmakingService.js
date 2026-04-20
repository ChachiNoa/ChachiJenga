const { MatchmakingQueue } = require('./MatchmakingQueue');
const { createRoom, handleGameEvents } = require('../game/gameEvents');

let ioInstance = null;
let dbInstance = null;

const queue = new MatchmakingQueue((player1, player2) => {
  if (ioInstance && dbInstance) {
    createRoom(ioInstance, player1, player2, dbInstance);
  }
});

function setupMatchmaking(io, socket, db) {
  if (!ioInstance) ioInstance = io;
  if (!dbInstance && db) dbInstance = db;

  // Set up game events handlers as well
  handleGameEvents(io, socket, db);

  socket.on('join_queue', (user) => {
    if (!user || !user.id) {
       return socket.emit('queue_error', 'Invalid user profile');
    }
    queue.addPlayer(socket.id, user);
    socket.emit('queue_joined', { status: 'waiting' });
  });

  socket.on('leave_queue', () => {
    queue.removePlayer(socket.id);
    socket.emit('queue_left');
  });

  socket.on('disconnect', () => {
    queue.removePlayer(socket.id);
  });
}

module.exports = { setupMatchmaking, queue };
