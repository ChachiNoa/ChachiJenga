const { TowerModel } = require('../game/TowerModel')
const { GAME } = require('../../shared/constants')

describe('TowerModel', () => {
  let tower

  beforeEach(() => {
    tower = new TowerModel()
  })

  describe('Initialization', () => {
    it('should initialize with 18 layers', () => {
      expect(tower.getLayers().length).toBe(GAME.TOWER_LAYERS)
    })

    it('should have 3 pieces per layer', () => {
      tower.getLayers().forEach((layer) => {
        expect(layer.pieces.length).toBe(GAME.PIECES_PER_LAYER)
      })
    })

    it('should have all pieces present initially', () => {
      tower.getLayers().forEach((layer) => {
        layer.pieces.forEach((piece) => {
          expect(piece.present).toBe(true)
        })
      })
    })

    it('should have total of 54 pieces', () => {
      const total = tower.getLayers().reduce(
        (sum, layer) => sum + layer.pieces.filter((p) => p.present).length, 0
      )
      expect(total).toBe(GAME.TOTAL_PIECES)
    })

    it('should alternate layer orientation', () => {
      const layers = tower.getLayers()
      expect(layers[0].orientation).toBe('horizontal')
      expect(layers[1].orientation).toBe('vertical')
      expect(layers[2].orientation).toBe('horizontal')
    })
  })

  describe('Piece Selection Rules', () => {
    it('should not allow selecting pieces from top 3 layers when full', () => {
      const topLayer = GAME.TOWER_LAYERS - 1
      const result = tower.canSelectPiece(topLayer, 0)
      expect(result).toBe(false)
    })

    it('should allow selecting pieces from non-protected layers', () => {
      const result = tower.canSelectPiece(0, 1) // Bottom layer, middle piece
      expect(result).toBe(true)
    })

    it('should not allow selecting already extracted pieces', () => {
      tower.extractPiece(0, 1)
      const result = tower.canSelectPiece(0, 1)
      expect(result).toBe(false)
    })

    it('should return selectable pieces list excluding protected and extracted', () => {
      const selectable = tower.getSelectablePieces()
      // Should not include pieces from top 3 layers
      selectable.forEach((p) => {
        expect(p.layer).toBeLessThan(GAME.TOWER_LAYERS - GAME.PROTECTED_TOP_LAYERS)
      })
    })
  })

  describe('Piece Extraction', () => {
    it('should extract a piece successfully', () => {
      const result = tower.extractPiece(0, 1)
      expect(result.success).toBe(true)
    })

    it('should mark the piece as not present after extraction', () => {
      tower.extractPiece(0, 1)
      const layer = tower.getLayer(0)
      expect(layer.pieces[1].present).toBe(false)
    })

    it('should fail to extract from protected layers', () => {
      const topLayer = GAME.TOWER_LAYERS - 1
      const result = tower.extractPiece(topLayer, 0)
      expect(result.success).toBe(false)
    })

    it('should fail to extract a piece that is already gone', () => {
      tower.extractPiece(0, 1)
      const result = tower.extractPiece(0, 1)
      expect(result.success).toBe(false)
    })

    it('should track total pieces extracted', () => {
      expect(tower.getPiecesExtracted()).toBe(0)
      tower.extractPiece(0, 1)
      expect(tower.getPiecesExtracted()).toBe(1)
      tower.extractPiece(1, 0)
      expect(tower.getPiecesExtracted()).toBe(2)
    })
  })

  describe('Layer State', () => {
    it('should report number of remaining pieces in a layer', () => {
      expect(tower.getRemainingInLayer(0)).toBe(3)
      tower.extractPiece(0, 0)
      expect(tower.getRemainingInLayer(0)).toBe(2)
      tower.extractPiece(0, 2)
      expect(tower.getRemainingInLayer(0)).toBe(1)
    })

    it('should detect when a layer is empty', () => {
      expect(tower.isLayerEmpty(0)).toBe(false)
      tower.extractPiece(0, 0)
      tower.extractPiece(0, 1)
      tower.extractPiece(0, 2)
      expect(tower.isLayerEmpty(0)).toBe(true)
    })
  })

  describe('Tower Collapse', () => {
    it('should not collapse when tower is stable', () => {
      tower.extractPiece(5, 1) // Center piece from mid layer
      expect(tower.checkCollapse()).toBe(false)
    })

    it('should collapse if total pieces extracted exceed threshold', () => {
      // Extract a LOT of pieces to trigger collapse probability
      for (let layer = 0; layer < 12; layer++) {
        for (let pos = 0; pos < 3; pos++) {
          tower.extractPiece(layer, pos)
        }
      }
      // After removing 36 of 54 pieces, collapse should be very likely
      // We use deterministic check: >= 60% removed => collapse
      expect(tower.checkCollapse()).toBe(true)
    })
  })

  describe('Serialization', () => {
    it('should serialize to a plain object', () => {
      tower.extractPiece(0, 1)
      const state = tower.toJSON()
      expect(state.layers).toHaveLength(GAME.TOWER_LAYERS)
      expect(state.layers[0].pieces[1].present).toBe(false)
      expect(state.piecesExtracted).toBe(1)
    })

    it('should restore from a serialized state', () => {
      tower.extractPiece(0, 1)
      const state = tower.toJSON()

      const restored = TowerModel.fromJSON(state)
      expect(restored.getRemainingInLayer(0)).toBe(2)
      expect(restored.getPiecesExtracted()).toBe(1)
    })
  })
})
