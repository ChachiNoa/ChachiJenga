const { PointCalculator } = require('../scoring/PointCalculator');
const { GAME } = require('../../shared/constants');

describe('PointCalculator', () => {
  it('should calculate points for extracted pieces', () => {
    const pieces = [
      { difficulty: GAME.DIFFICULTY.EASY },
      { difficulty: GAME.DIFFICULTY.EASY },
      { difficulty: GAME.DIFFICULTY.MEDIUM },
      { difficulty: GAME.DIFFICULTY.HARD }
    ];
    // 10 + 10 + 25 + 50 = 95
    expect(PointCalculator.calculatePiecesBaseScore(pieces)).toBe(95);
  });

  it('should calculate victory score: pieces + 100', () => {
    const pieces = [{ difficulty: GAME.DIFFICULTY.EASY }]; // 10
    expect(PointCalculator.calculateMatchScore(pieces, 'VICTORY')).toBe(110);
  });

  it('should calculate defeat score: max(pieces - 50, -50)', () => {
    const pieces = [
      { difficulty: GAME.DIFFICULTY.EASY },
      { difficulty: GAME.DIFFICULTY.EASY } // 20
    ];
    // 20 - 50 = -30, max(-30, -50) = -30
    expect(PointCalculator.calculateMatchScore(pieces, 'DEFEAT')).toBe(-30);

    const noPieces = []; // 0
    // 0 - 50 = -50
    expect(PointCalculator.calculateMatchScore(noPieces, 'DEFEAT')).toBe(-50);
  });

  it('should calculate forfeit score as static -75', () => {
    const pieces = [{ difficulty: GAME.DIFFICULTY.HARD }]; // 50
    expect(PointCalculator.calculateMatchScore(pieces, 'FORFEIT')).toBe(-75);
  });

  it('should calculate draw score: pieces * 0.6 + bonus_dificultad', () => {
    // 10 + 25 = 35 => pieces * 0.6 = 21
    // Ties bonus: Medium (+3), Easy (+0). Total bonus = 3
    // Final score = 21 + 3 = 24
    const pieces = [
      { difficulty: GAME.DIFFICULTY.EASY },
      { difficulty: GAME.DIFFICULTY.MEDIUM }
    ];
    expect(PointCalculator.calculateMatchScore(pieces, 'DRAW')).toBe(24);
    
    // Hard (+8). Score = 50 => 30 + 8 = 38
    const hardPiece = [{ difficulty: GAME.DIFFICULTY.HARD }];
    expect(PointCalculator.calculateMatchScore(hardPiece, 'DRAW')).toBe(38);
  });
});
