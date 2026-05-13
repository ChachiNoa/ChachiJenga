import { describe, it, expect } from 'vitest'
import { DifficultyManager } from '../game/DifficultyManager'
import { GAME } from '@/shared/constants'

describe('DifficultyManager', () => {
  const createMockLayers = (targetLayerIndex, layerPieces) => {
    const layers = Array(18).fill(null).map(() => ({ pieces: [{present: true}, {present: true}, {present: true}] }))
    layers[targetLayerIndex].pieces = layerPieces
    // Make sure there is a layer above so it's not the topmost
    if (targetLayerIndex < 17) {
      layers[targetLayerIndex + 1].pieces = [{present: true}, {present: true}, {present: true}]
    }
    return layers
  }

  it('should return EASY for center piece', () => {
    const layerPieces = [{ present: true }, { present: true }, { present: true }]
    const layers = createMockLayers(1, layerPieces)
    expect(DifficultyManager.getDifficulty(1, 1, layers)).toBe(GAME.DIFFICULTY.EASY)
  })

  it('should return EASY for side piece when both sides are present', () => {
    const layerPieces = [{ present: true }, { present: true }, { present: true }]
    const layers = createMockLayers(1, layerPieces)
    expect(DifficultyManager.getDifficulty(0, 1, layers)).toBe(GAME.DIFFICULTY.EASY)
    expect(DifficultyManager.getDifficulty(2, 1, layers)).toBe(GAME.DIFFICULTY.EASY)
  })

  it('should return HARD for side piece when central piece is missing', () => {
    const centralMissing = [{ present: true }, { present: false }, { present: true }]
    const layers = createMockLayers(1, centralMissing)
    expect(DifficultyManager.getDifficulty(0, 1, layers)).toBe(GAME.DIFFICULTY.HARD)
    expect(DifficultyManager.getDifficulty(2, 1, layers)).toBe(GAME.DIFFICULTY.HARD)
  })

  it('should return MEDIUM for central piece and EASY for the other side when one side is missing', () => {
    const leftMissing = [{ present: false }, { present: true }, { present: true }]
    const layersLeft = createMockLayers(1, leftMissing)
    expect(DifficultyManager.getDifficulty(1, 1, layersLeft)).toBe(GAME.DIFFICULTY.MEDIUM)
    expect(DifficultyManager.getDifficulty(2, 1, layersLeft)).toBe(GAME.DIFFICULTY.EASY)

    const rightMissing = [{ present: true }, { present: true }, { present: false }]
    const layersRight = createMockLayers(1, rightMissing)
    expect(DifficultyManager.getDifficulty(1, 1, layersRight)).toBe(GAME.DIFFICULTY.MEDIUM)
    expect(DifficultyManager.getDifficulty(0, 1, layersRight)).toBe(GAME.DIFFICULTY.EASY)
  })

  it('should return MEDIUM when two pieces are missing', () => {
    const sidesMissing = [{ present: false }, { present: true }, { present: false }]
    const layersCenter = createMockLayers(1, sidesMissing)
    expect(DifficultyManager.getDifficulty(1, 1, layersCenter)).toBe(GAME.DIFFICULTY.MEDIUM)

    const oneSideAndCenterMissing = [{ present: true }, { present: false }, { present: false }]
    const layersSide = createMockLayers(1, oneSideAndCenterMissing)
    expect(DifficultyManager.getDifficulty(0, 1, layersSide)).toBe(GAME.DIFFICULTY.MEDIUM)
  })
})
