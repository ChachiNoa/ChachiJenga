const { EloCalculator } = require('../scoring/EloCalculator');

describe('EloCalculator', () => {
  it('should get dynamic K factor based on total matches', () => {
    expect(EloCalculator.getKFactor(10)).toBe(32);
    expect(EloCalculator.getKFactor(29)).toBe(32);
    expect(EloCalculator.getKFactor(30)).toBe(24);
    expect(EloCalculator.getKFactor(99)).toBe(24);
    expect(EloCalculator.getKFactor(100)).toBe(16);
    expect(EloCalculator.getKFactor(150)).toBe(16);
  });

  it('should calculate expected score', () => {
    // Both 1000 ELO means 50% probability
    const expected = EloCalculator.getExpectedScore(1000, 1000);
    expect(expected).toBe(0.5);

    // Player A 1200, Player B 1000
    const expectedStronger = EloCalculator.getExpectedScore(1200, 1000);
    expect(expectedStronger).toBeGreaterThan(0.5);
  });

  it('should calculate new ELO for VICTORY', () => {
    const p1Elo = 1000;
    const p2Elo = 1000;
    const matchesPlayP1 = 10; // K = 32

    const newElo = EloCalculator.calculateNewElo(p1Elo, p2Elo, matchesPlayP1, 'VICTORY');
    // Expected: 0.5. Actual: 1. Delta: 0.5. NewElo: 1000 + 32 * 0.5 = 1016
    expect(newElo).toBe(1016);
  });

  it('should calculate new ELO for DEFEAT', () => {
    const p1Elo = 1000;
    const p2Elo = 1000;
    const matchesPlayP1 = 10; // K = 32

    const newElo = EloCalculator.calculateNewElo(p1Elo, p2Elo, matchesPlayP1, 'DEFEAT');
    // Expected: 0.5. Actual: 0. Delta: -0.5. NewElo: 1000 + 32 * -0.5 = 984
    expect(newElo).toBe(984);
  });

  it('should calculate new ELO for FORFEIT with 1.2x penalty', () => {
    const p1Elo = 1000;
    const p2Elo = 1000;
    const matchesPlayP1 = 10; // K = 32

    const newElo = EloCalculator.calculateNewElo(p1Elo, p2Elo, matchesPlayP1, 'FORFEIT');
    // Expected: 0.5. Actual: 0. Delta: -0.5. Base rating diff: -16
    // Penalty: -16 * 1.2 = -19.2 -> Rounds to -19. NewElo = 981
    expect(Math.floor(newElo)).toBe(981); // 1000 - 19
  });

  it('should calculate new ELO for DRAW', () => {
    const p1Elo = 1000;
    const p2Elo = 1200;
    const matchesPlayP1 = 10; // K = 32

    const newElo = EloCalculator.calculateNewElo(p1Elo, p2Elo, matchesPlayP1, 'DRAW');
    // Weaker player should gain some ELO on a draw against stronger
    expect(newElo).toBeGreaterThan(1000);
  });

  it('should cap minimum ELO at 100', () => {
    const p1Elo = 110;
    const p2Elo = 1500;
    const matchesPlayP1 = 10;
    
    // Heavy loss
    const newElo = EloCalculator.calculateNewElo(p1Elo, p2Elo, matchesPlayP1, 'FORFEIT');
    expect(newElo).toBe(100);
  });
});
