const { TowerModel } = require('./TowerModel');
const { PointCalculator } = require('../scoring/PointCalculator');

class GameRoom {
  constructor(roomId, player1, player2, io, db) {
    this.roomId = roomId;
    this.players = [player1, player2];
    this.io = io;
    this.db = db;
    this.tower = new TowerModel();
    
    // Track extracted pieces per player for scoring { difficulty }
    this.extractedPieces = [[], []]; // [player0Pieces, player1Pieces]
    
    // Choose starting player
    this.currentTurnIndex = Math.random() < 0.5 ? 0 : 1;
    this.status = 'WAITING'; // WAITING, IN_PROGRESS, ENDED
  }

  startGame() {
    this.status = 'IN_PROGRESS';
    this._startSelectionTimer();
    this.io.to(this.roomId).emit('game_started', {
      tower: this.tower.toJSON(),
      turn: this.players[this.currentTurnIndex].socketId,
      selectionEndTime: this.selectionEndTime,
      scores: this.getLiveScores()
    });
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  switchTurn() {
    this.currentTurnIndex = 1 - this.currentTurnIndex;
    this._startSelectionTimer();
    this.io.to(this.roomId).emit('turn_changed', {
      turn: this.players[this.currentTurnIndex].socketId,
      selectionEndTime: this.selectionEndTime,
      scores: this.getLiveScores()
    });
  }

  getLiveScores() {
    return {
      [this.players[0].socketId]: PointCalculator.calculatePiecesBaseScore(this.extractedPieces[0]),
      [this.players[1].socketId]: PointCalculator.calculatePiecesBaseScore(this.extractedPieces[1])
    };
  }

  handleSelectPiece(socketId, layer, pos) {
    if (this.getCurrentPlayer().socketId !== socketId || this.status !== 'IN_PROGRESS') {
      return { success: false, reason: 'Not your turn' };
    }
    
    if (!this.tower.canSelectPiece(layer, pos)) {
      return { success: false, reason: 'Invalid piece' };
    }

    if (this.selectionTimer) {
      clearTimeout(this.selectionTimer);
      this.selectionTimer = null;
    }

    // Piece is valid, notify both players challenge started
    this.io.to(this.roomId).emit('challenge_started', {
      layer,
      pos,
      player: socketId
    });

    // Server-side timing truth (45s + edge grace period of 2s)
    this.challengeEndTime = Date.now() + 47000;
    this._startChallengeTimer();

    return { success: true };
  }

  _startChallengeTimer() {
    if (this.challengeTimer) clearTimeout(this.challengeTimer);
    const msLeft = this.challengeEndTime - Date.now();
    
    if (msLeft <= 0) {
      this.io.to(this.roomId).emit('tower_collapsed', { player: this.getCurrentPlayer().socketId });
      this.endGame('COLLAPSE', this.getCurrentPlayer().socketId);
    } else {
      this.challengeTimer = setTimeout(() => {
        this._startChallengeTimer();
      }, msLeft);
    }
  }

  _startSelectionTimer() {
    if (this.selectionTimer) clearTimeout(this.selectionTimer);
    
    // Server-side timing truth (15s + grace period of 1s)
    this.selectionEndTime = Date.now() + 16000;
    
    const checkTimeout = () => {
      if (this.status !== 'IN_PROGRESS') return;
      const msLeft = this.selectionEndTime - Date.now();
      if (msLeft <= 0) {
        this.io.to(this.roomId).emit('tower_collapsed', { player: this.getCurrentPlayer().socketId, reason: 'selection_timeout' });
        this.endGame('TIMEOUT', this.getCurrentPlayer().socketId);
      } else {
        this.selectionTimer = setTimeout(checkTimeout, msLeft);
      }
    };
    checkTimeout();
  }

  handleDrawingResult(socketId, data) {
    if (this.getCurrentPlayer().socketId !== socketId || this.status !== 'IN_PROGRESS') return;
    
    // Forward to opponent
    this.io.to(this.players.find(p => p.socketId !== socketId).socketId).emit('opponent_drawing_result', data);

    if (!data.valid) {
      // Apply error penalty on the server (-4s)
      this.challengeEndTime -= 4000;
      this._startChallengeTimer();
    }
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

    // Track extracted piece for scoring
    this.extractedPieces[this.currentTurnIndex].push({ difficulty: result.difficulty });

    this.io.to(this.roomId).emit('piece_extracted', {
      layer,
      pos,
      player: socketId,
      scores: this.getLiveScores()
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

    // Default payload if db is not connected
    let summaryData1 = { result: 'DRAW', eloChange: 0, points: 0, prevElo: 1000, newElo: 1000 };
    let summaryData2 = { result: 'DRAW', eloChange: 0, points: 0, prevElo: 1000, newElo: 1000 };

    if (this.db) {
      try {
        const p1 = this.players[0].user;
        const p2 = this.players[1].user;
        
        const row1 = this.db.prepare('SELECT elo, games_played FROM users WHERE id = ?').get(p1.id);
        const row2 = this.db.prepare('SELECT elo, games_played FROM users WHERE id = ?').get(p2.id);

        const elo1 = row1?.elo || 1000;
        const gp1 = row1?.games_played || 0;
        const elo2 = row2?.elo || 1000;
        const gp2 = row2?.games_played || 0;

        let result1 = 'DRAW';
        let result2 = 'DRAW';

        if (reason === 'COLLAPSE' || reason === 'FORFEIT' || reason === 'TIMEOUT') {
          result1 = (this.players[0].socketId === loserSocketId) ? 'DEFEAT' : 'VICTORY';
          if (reason === 'FORFEIT' && result1 === 'DEFEAT') result1 = 'FORFEIT';

          result2 = (this.players[1].socketId === loserSocketId) ? 'DEFEAT' : 'VICTORY';
          if (reason === 'FORFEIT' && result2 === 'DEFEAT') result2 = 'FORFEIT';
        }

        const { PointCalculator } = require('../scoring/PointCalculator');
        const { EloCalculator } = require('../scoring/EloCalculator');

        // Use the real extracted pieces tracked during the game
        const pieces1 = this.extractedPieces[0];
        const pieces2 = this.extractedPieces[1];
        const pts1 = PointCalculator.calculateMatchScore(pieces1, result1);
        const pts2 = PointCalculator.calculateMatchScore(pieces2, result2);

        const newElo1 = EloCalculator.calculateNewElo(elo1, elo2, gp1, result1);
        const newElo2 = EloCalculator.calculateNewElo(elo2, elo1, gp2, result2);

        const eloChg1 = newElo1 - elo1;
        const eloChg2 = newElo2 - elo2;

        summaryData1 = { result: result1, eloChange: eloChg1, points: pts1, prevElo: elo1, newElo: newElo1, piecesExtracted: pieces1.length };
        summaryData2 = { result: result2, eloChange: eloChg2, points: pts2, prevElo: elo2, newElo: newElo2, piecesExtracted: pieces2.length };

        const updateUsr = this.db.prepare(`
          UPDATE users 
          SET elo = ?, total_points = total_points + ?, games_played = games_played + 1,
              games_won = games_won + ?, games_lost = games_lost + ?, games_drawn = games_drawn + ?,
              pieces_extracted = pieces_extracted + ?
          WHERE id = ?
        `);
        
        updateUsr.run(newElo1, pts1, result1 === 'VICTORY' ? 1 : 0, result1 === 'DEFEAT' || result1 === 'FORFEIT' ? 1 : 0, result1 === 'DRAW' ? 1 : 0, pieces1.length, p1.id);
        updateUsr.run(newElo2, pts2, result2 === 'VICTORY' ? 1 : 0, result2 === 'DEFEAT' || result2 === 'FORFEIT' ? 1 : 0, result2 === 'DRAW' ? 1 : 0, pieces2.length, p2.id);

        const insMatch = this.db.prepare(`
          INSERT INTO matches (player1_id, player2_id, winner_id, result, player1_points, player2_points, player1_elo_change, player2_elo_change)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        insMatch.run(
          p1.id, p2.id,
          result1 === 'VICTORY' ? p1.id : (result2 === 'VICTORY' ? p2.id : null),
          reason === 'DRAW' ? 'draw' : (reason === 'FORFEIT' ? 'forfeit' : 'win'),
          pts1, pts2, eloChg1, eloChg2
        );

      } catch (err) {
        console.error('[GameRoom DB error]', err);
      }
    }

    // Fire over network
    this.io.to(this.players[0].socketId).emit('game_over', { reason, summary: summaryData1 });
    this.io.to(this.players[1].socketId).emit('game_over', { reason, summary: summaryData2 });
  }

  handleForfeit(socketId) {
    this.endGame('FORFEIT', socketId);
  }
}

module.exports = { GameRoom };
