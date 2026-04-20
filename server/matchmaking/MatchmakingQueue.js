class MatchmakingQueue {
  constructor(onMatch) {
    this.onMatch = onMatch;
    this.queue = [];
  }

  addPlayer(socketId, user) {
    // Check if the user is already in the queue by user.id
    const existingIndex = this.queue.findIndex(p => p.user.id === user.id);
    
    if (existingIndex !== -1) {
      // Update socket ID if they re-joined the queue
      this.queue[existingIndex].socketId = socketId;
      return;
    }

    this.queue.push({ socketId, user });

    // Try to match
    if (this.queue.length >= 2) {
      const player1 = this.queue.shift();
      const player2 = this.queue.shift();
      this.onMatch(player1, player2);
    }
  }

  removePlayer(socketId) {
    this.queue = this.queue.filter(p => p.socketId !== socketId);
  }
  
  getQueueSize() {
    return this.queue.length;
  }
}

module.exports = { MatchmakingQueue };
