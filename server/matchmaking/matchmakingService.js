const { MatchmakingQueue } = require('./MatchmakingQueue');
const { createRoom, handleGameEvents } = require('../game/gameEvents');

let ioInstance = null;

const queue = new MatchmakingQueue((player1, player2) => {
  if (ioInstance) {
    createRoom(ioInstance, player1, player2);
  }
});

function setupMatchmaking(io, socket) {
  if (!ioInstance) ioInstance = io;

  // Set up game events handlers as well
  handleGameEvents(io, socket);

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
