class MatchmakingQueue {
  constructor(onMatch) {
    this.onMatch = onMatch;
    this.queue = [];
  }

  addPlayer(socketId, user) {
    console.log(`[Queue] addPlayer called for user ${user.id} (${socketId})`);
    // Check if the user is already in the queue by user.id
    const existingIndex = this.queue.findIndex(p => p.user.id === user.id);
    
    if (existingIndex !== -1) {
      console.log(`[Queue] User ${user.id} already in queue. Updating socketId.`);
      // Update socket ID if they re-joined the queue
      this.queue[existingIndex].socketId = socketId;
      return;
    }

    this.queue.push({ socketId, user });
    console.log(`[Queue] Added user ${user.id}. Total queue length: ${this.queue.length}`);

    // Try to match
    if (this.queue.length >= 2) {
      const player1 = this.queue.shift();
      const player2 = this.queue.shift();
      console.log(`[Queue] Matching player ${player1.user.id} with ${player2.user.id}`);
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
