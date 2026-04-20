const { TowerModel } = require('./TowerModel');

class GameRoom {
  constructor(roomId, player1, player2, io) {
    this.roomId = roomId;
    this.players = [player1, player2];
    this.io = io;
    this.tower = new TowerModel();
    
    // Choose starting player
    this.currentTurnIndex = Math.random() < 0.5 ? 0 : 1;
    this.status = 'WAITING'; // WAITING, IN_PROGRESS, ENDED
  }

  startGame() {
    this.status = 'IN_PROGRESS';
    this.io.to(this.roomId).emit('game_started', {
      tower: this.tower.toJSON(),
      turn: this.players[this.currentTurnIndex].socketId
    });
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  switchTurn() {
    this.currentTurnIndex = 1 - this.currentTurnIndex;
    this.io.to(this.roomId).emit('turn_changed', {
      turn: this.players[this.currentTurnIndex].socketId
    });
  }

  handleSelectPiece(socketId, layer, pos) {
    if (this.getCurrentPlayer().socketId !== socketId || this.status !== 'IN_PROGRESS') {
      return { success: false, reason: 'Not your turn' };
    }
    
    if (!this.tower.canSelectPiece(layer, pos)) {
      return { success: false, reason: 'Invalid piece' };
    }

    // Piece is valid, notify both players challenge started
    this.io.to(this.roomId).emit('challenge_started', {
      layer,
      pos,
      player: socketId
    });

    // Server-side timing truth (45s + edge grace period of 2s)
    if (this.challengeTimer) clearTimeout(this.challengeTimer);
    this.challengeTimer = setTimeout(() => {
      // Time is up on server
      this.io.to(this.roomId).emit('tower_collapsed', { player: socketId });
      this.endGame('COLLAPSE', socketId);
    }, 47000); 

    return { success: true };
  }

  handlePieceExtracted(socketId, layer, pos) {
     if (this.getCurrentPlayer().socketId !== socketId || this.status !== 'IN_PROGRESS') {
      return { success: false, reason: 'Not your turn' };
    }

    if (this.challengeTimer) {
      clearTimeout(this.challengeTimer);
      this.challengeTimer = null;
    }

    const result = this.tower.extractPiece(layer, pos);
    if (!result.success) return result;

    this.io.to(this.roomId).emit('piece_extracted', {
      layer,
      pos,
      player: socketId
    });

    if (this.tower.checkCollapse()) {
      this.endGame('COLLAPSE', socketId); // Current player collapsed the tower
    } else {
      this.switchTurn();
    }

    return { success: true };
  }

  endGame(reason, loserSocketId) {
    this.status = 'ENDED';
    this.io.to(this.roomId).emit('game_over', {
      reason,
      loser: loserSocketId
    });
  }

  handleForfeit(socketId) {
    this.endGame('FORFEIT', socketId);
  }
}

module.exports = { GameRoom };
