const { GAME } = require('../../shared/constants')

class TowerModel {
  constructor() {
    this._layers = []
    this._piecesExtracted = 0
    this._initializeTower()
  }

  _initializeTower() {
    for (let i = 0; i < GAME.TOWER_LAYERS; i++) {
      this._layers.push({
        index: i,
        orientation: i % 2 === 0 ? 'horizontal' : 'vertical',
        pieces: Array.from({ length: GAME.PIECES_PER_LAYER }, (_, pos) => ({
          position: pos,
          present: true,
        })),
      })
    }
  }

  getLayers() {
    return this._layers
  }

  getLayer(layerIndex) {
    return this._layers[layerIndex]
  }

  /**
   * Check if a piece can be selected for extraction.
   */
  canSelectPiece(layerIndex, position) {
    // Validate bounds
    if (layerIndex < 0 || layerIndex >= GAME.TOWER_LAYERS) return false
    if (position < 0 || position >= GAME.PIECES_PER_LAYER) return false

    // Protect top N layers
    if (layerIndex >= GAME.TOWER_LAYERS - GAME.PROTECTED_TOP_LAYERS) return false

    // Check piece is still present
    const piece = this._layers[layerIndex].pieces[position]
    return piece.present
  }

  /**
   * Get all pieces that can currently be selected.
   */
  getSelectablePieces() {
    const selectable = []
    for (let layer = 0; layer < GAME.TOWER_LAYERS - GAME.PROTECTED_TOP_LAYERS; layer++) {
      for (let pos = 0; pos < GAME.PIECES_PER_LAYER; pos++) {
        if (this._layers[layer].pieces[pos].present) {
          selectable.push({ layer, position: pos })
        }
      }
    }
    return selectable
  }

  /**
   * Extract a piece from the tower.
   * @returns {{ success: boolean, reason?: string }}
   */
  extractPiece(layerIndex, position) {
    if (!this.canSelectPiece(layerIndex, position)) {
      return { success: false, reason: 'Cannot select this piece' }
    }

    // Calculate difficulty BEFORE extracting so the layer state is still intact
    const difficulty = this._getDifficulty(layerIndex, position)

    this._layers[layerIndex].pieces[position].present = false
    this._piecesExtracted++

    if (this.isLayerEmpty(layerIndex)) {
      this._collapseEmptyLayer(layerIndex)
    }

    return { success: true, difficulty }
  }

  /**
   * Calculates difficulty of a piece based on its layer state.
   * Same logic as client DifficultyManager.
   */
  _getDifficulty(layerIndex, position) {
    // Top layer is always easy
    let topmostActiveLayer = -1
    for (let i = this._layers.length - 1; i >= 0; i--) {
      if (this._layers[i].pieces.some(p => p.present)) {
        topmostActiveLayer = i
        break
      }
    }
    if (layerIndex === topmostActiveLayer) return GAME.DIFFICULTY.EASY

    const layerPieces = this._layers[layerIndex].pieces
    const missingCount = layerPieces.filter(p => !p.present).length

    if (missingCount === 0) return GAME.DIFFICULTY.EASY
    if (missingCount === 1) {
      const isCentralMissing = !layerPieces[1].present
      if (isCentralMissing) return GAME.DIFFICULTY.HARD
      return position === 1 ? GAME.DIFFICULTY.MEDIUM : GAME.DIFFICULTY.EASY
    }
    if (missingCount === 2) return GAME.DIFFICULTY.MEDIUM

    return GAME.DIFFICULTY.EASY
  }

  _collapseEmptyLayer(emptyLayerIndex) {
    // Drop the present state of all layers above down by 1
    for (let i = emptyLayerIndex; i < GAME.TOWER_LAYERS - 1; i++) {
      for (let pos = 0; pos < GAME.PIECES_PER_LAYER; pos++) {
        this._layers[i].pieces[pos].present = this._layers[i + 1].pieces[pos].present
      }
    }
    // Clear the topmost layer
    for (let pos = 0; pos < GAME.PIECES_PER_LAYER; pos++) {
      this._layers[GAME.TOWER_LAYERS - 1].pieces[pos].present = false
    }
  }

  getPiecesExtracted() {
    return this._piecesExtracted
  }

  getRemainingInLayer(layerIndex) {
    return this._layers[layerIndex].pieces.filter((p) => p.present).length
  }

  isLayerEmpty(layerIndex) {
    return this.getRemainingInLayer(layerIndex) === 0
  }

  checkCollapse() {
    return this.getSelectablePieces().length === 0
  }

  toJSON() {
    return {
      layers: this._layers.map((layer) => ({
        index: layer.index,
        orientation: layer.orientation,
        pieces: layer.pieces.map((p) => ({ position: p.position, present: p.present })),
      })),
      piecesExtracted: this._piecesExtracted,
    }
  }

  static fromJSON(data) {
    const tower = new TowerModel()
    tower._layers = data.layers.map((layer) => ({
      index: layer.index,
      orientation: layer.orientation,
      pieces: layer.pieces.map((p) => ({ position: p.position, present: p.present })),
    }))
    tower._piecesExtracted = data.piecesExtracted
    return tower
  }
}

module.exports = { TowerModel }
