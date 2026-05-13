const { io } = require('socket.io-client');
const s1 = io('http://localhost:3001');
const s2 = io('http://localhost:3001');

s1.on('connect', () => {
  console.log('s1 connected');
  s1.emit('join_queue', { id: 1, name: 'Player 1' });
});

s2.on('connect', () => {
  console.log('s2 connected');
  s2.emit('join_queue', { id: 2, name: 'Player 2' });
});

s1.on('game_started', (data) => console.log('s1 game_started!'));
s2.on('game_started', (data) => {
  console.log('s2 game_started!');
  setTimeout(() => process.exit(0), 500);
});
