import { describe, it, expect } from 'vitest'
import { DifficultyManager } from '../game/DifficultyManager'
import { GAME } from '../../../shared/constants'

describe('DifficultyManager', () => {
  it('should return EASY for center piece', () => {
    const layerPieces = [{ present: true }, { present: true }, { present: true }]
    expect(DifficultyManager.getDifficulty(1, layerPieces)).toBe(GAME.DIFFICULTY.EASY)
  })

  it('should return MEDIUM for side piece when both sides are present', () => {
    const layerPieces = [{ present: true }, { present: true }, { present: true }]
    expect(DifficultyManager.getDifficulty(0, layerPieces)).toBe(GAME.DIFFICULTY.MEDIUM)
    expect(DifficultyManager.getDifficulty(2, layerPieces)).toBe(GAME.DIFFICULTY.MEDIUM)
  })

  it('should return HARD for side piece when the other side is already extracted', () => {
    const leftMissing = [{ present: false }, { present: true }, { present: true }]
    expect(DifficultyManager.getDifficulty(2, leftMissing)).toBe(GAME.DIFFICULTY.HARD)

    const rightMissing = [{ present: true }, { present: true }, { present: false }]
    expect(DifficultyManager.getDifficulty(0, rightMissing)).toBe(GAME.DIFFICULTY.HARD)
  })

  it('should handle middle piece when sides are missing', () => {
    const sidesMissing = [{ present: false }, { present: true }, { present: false }]
    expect(DifficultyManager.getDifficulty(1, sidesMissing)).toBe(GAME.DIFFICULTY.EASY)
  })
})
