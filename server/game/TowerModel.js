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

    this._layers[layerIndex].pieces[position].present = false
    this._piecesExtracted++

    return { success: true }
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

  /**
   * Deterministic collapse check based on percentage of pieces extracted.
   * Collapse if >= 60% of total pieces have been extracted.
   */
  checkCollapse() {
    const ratio = this._piecesExtracted / GAME.TOTAL_PIECES
    return ratio >= 0.6
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
