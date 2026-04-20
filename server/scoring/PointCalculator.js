const { GAME } = require('../../shared/constants');

class PointCalculator {
  static getPieceValue(difficulty) {
    switch (difficulty) {
      case GAME.DIFFICULTY.HARD: return 50;
      case GAME.DIFFICULTY.MEDIUM: return 25;
      case GAME.DIFFICULTY.EASY: return 10;
      default: return 10;
    }
  }

  static getBonus(difficulty) {
    switch (difficulty) {
      case GAME.DIFFICULTY.HARD: return 8;
      case GAME.DIFFICULTY.MEDIUM: return 3;
      case GAME.DIFFICULTY.EASY: return 0;
      default: return 0;
    }
  }

  static calculatePiecesBaseScore(pieces = []) {
    return pieces.reduce((total, p) => total + PointCalculator.getPieceValue(p.difficulty), 0);
  }

  static calculateMatchScore(pieces, result) {
    const baseScore = PointCalculator.calculatePiecesBaseScore(pieces);

    switch (result) {
      case 'VICTORY':
        return baseScore + 100;
      case 'DEFEAT':
        return Math.max(baseScore - 50, -50);
      case 'FORFEIT':
        return -75;
      case 'DRAW': {
        const base = baseScore * 0.6;
        const bonus = pieces.reduce((total, p) => total + PointCalculator.getBonus(p.difficulty), 0);
        return Math.floor(base + bonus);
      }
      default:
        return 0;
    }
  }
}
module.exports = { PointCalculator };
