class EloCalculator {
  static getKFactor(totalMatches) {
    if (totalMatches < 30) return 32;
    if (totalMatches <= 100) return 24;
    return 16;
  }

  static getExpectedScore(playerElo, opponentElo) {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  }

  static calculateNewElo(playerElo, opponentElo, totalMatches, result) {
    const K = EloCalculator.getKFactor(totalMatches);
    const expectedScore = EloCalculator.getExpectedScore(playerElo, opponentElo);
    
    let actualScore = 0;
    let isForfeit = false;

    if (result === 'VICTORY') actualScore = 1;
    else if (result === 'DRAW') actualScore = 0.5;
    else if (result === 'DEFEAT') actualScore = 0;
    else if (result === 'FORFEIT') {
      actualScore = 0;
      isForfeit = true;
    }

    let diff = K * (actualScore - expectedScore);
    
    if (isForfeit) {
      diff = diff * 1.2;
    }

    let newElo = Math.round(playerElo + diff);
    
    if (newElo < 100) newElo = 100;
    
    return newElo;
  }
}
module.exports = { EloCalculator };
