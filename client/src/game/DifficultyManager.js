import { GAME } from '@/shared/constants'

export class DifficultyManager {
  /**
   * Calculate the difficulty of extracting a piece at a specific position.
   * @param {number} position - Piece position in the layer (0, 1, or 2)
   * @param {Array<{present: boolean}>} layerPieces - State of the 3 pieces in the layer
   * @returns {number} Difficulty level (1 = EASY, 2 = MEDIUM, 3 = HARD)
   */
  static getDifficulty(position, layerIndex, allLayers) {
    if (!allLayers) {
      // Fallback for tests if layers not provided
      return GAME.DIFFICULTY.EASY
    }

    // Determine the topmost layer that has at least one piece
    let topmostActiveLayer = -1
    for (let i = allLayers.length - 1; i >= 0; i--) {
      if (allLayers[i].pieces.some(p => p.present)) {
        topmostActiveLayer = i
        break
      }
    }

    // If this is the topmost active layer, all pieces are EASY
    if (layerIndex === topmostActiveLayer) {
      return GAME.DIFFICULTY.EASY
    }

    const layerPieces = allLayers[layerIndex].pieces
    const missingCount = layerPieces.filter(p => !p.present).length

    if (missingCount === 0) {
      // 3 piezas presentes
      if (position === 1) return GAME.DIFFICULTY.EASY
      return GAME.DIFFICULTY.MEDIUM
    }

    if (missingCount === 1) {
      // 2 piezas presentes
      if (position === 1) {
        return GAME.DIFFICULTY.MEDIUM // Si sacamos la del medio, queda una sola en un lado
      } else {
        return GAME.DIFFICULTY.HARD // Si sacamos un lado, queda solo la otra
      }
    }

    if (missingCount === 2) {
      // 1 pieza presente (la última)
      return GAME.DIFFICULTY.HARD
    }

    return GAME.DIFFICULTY.EASY // Fallback
  }
}
