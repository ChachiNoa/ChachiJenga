import { GAME } from '@/shared/constants'

export class DifficultyManager {
  /**
   * Calculate the difficulty of extracting a piece at a specific position.
   * @param {number} position - Piece position in the layer (0, 1, or 2)
   * @param {Array<{present: boolean}>} layerPieces - State of the 3 pieces in the layer
   * @returns {number} Difficulty level (1 = EASY, 2 = MEDIUM, 3 = HARD)
   */
  static getDifficulty(position, layerPieces) {
    if (position === 1) {
      return GAME.DIFFICULTY.EASY
    }

    if (position === 0) {
      return layerPieces[2].present ? GAME.DIFFICULTY.MEDIUM : GAME.DIFFICULTY.HARD
    }

    if (position === 2) {
      return layerPieces[0].present ? GAME.DIFFICULTY.MEDIUM : GAME.DIFFICULTY.HARD
    }

    return GAME.DIFFICULTY.EASY // Fallback
  }
}
