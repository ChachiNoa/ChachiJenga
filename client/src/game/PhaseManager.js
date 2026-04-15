import { GAME } from '../../../shared/constants'

// Note: Shapes will be defined fully later. For now we use placeholder types for logic.
const SHAPE_CATEGORIES = {
  [GAME.DIFFICULTY.EASY]: ['circle', 'square', 'triangle', 'rectangle'],
  [GAME.DIFFICULTY.MEDIUM]: ['star', 'heart', 'diamond', 'arrow'],
  [GAME.DIFFICULTY.HARD]: ['lightning', 'moon', 'spiral', 'cross', 'hexagon']
}

export class PhaseManager {
  constructor(difficulty) {
    this.difficulty = difficulty
    this.currentPhase = 1
    this.timeRemaining = GAME.TIMER_SECONDS * 1000 // ms
    this.timerInterval = null
    this.onTick = null
    this.onTimeout = null
    
    this.phases = this._generatePhases()
  }

  _getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  _generatePhases() {
    const phases = []
    
    for (let p = 1; p <= 3; p++) {
      let shapeCount = 3
      let availableTypes = [...SHAPE_CATEGORIES[GAME.DIFFICULTY.EASY]]

      if (this.difficulty === GAME.DIFFICULTY.MEDIUM) {
        shapeCount = this._getRandomInt(4, 5)
        availableTypes = [...SHAPE_CATEGORIES[GAME.DIFFICULTY.EASY], ...SHAPE_CATEGORIES[GAME.DIFFICULTY.MEDIUM]]
      } else if (this.difficulty === GAME.DIFFICULTY.HARD) {
        shapeCount = this._getRandomInt(5, 6)
        availableTypes = [...SHAPE_CATEGORIES[GAME.DIFFICULTY.EASY], ...SHAPE_CATEGORIES[GAME.DIFFICULTY.MEDIUM], ...SHAPE_CATEGORIES[GAME.DIFFICULTY.HARD]]
      }

      const shapes = []
      for (let i = 0; i < shapeCount; i++) {
        // Just pick a random type
        const type = availableTypes[this._getRandomInt(0, availableTypes.length - 1)]
        shapes.push({
          id: `phase_${p}_shape_${i}`,
          type,
          completed: false,
          // Positions can be added later by the DrawingScreen
        })
      }
      
      phases.push(shapes)
    }
    
    return phases
  }

  getCurrentPhase() {
    return this.currentPhase
  }

  getCurrentPhaseShapes() {
    return this.phases[this.currentPhase - 1]
  }

  getTimeRemaining() {
    return this.timeRemaining
  }

  completeShape(shapeId) {
    const shapes = this.getCurrentPhaseShapes()
    const shape = shapes.find(s => s.id === shapeId)
    
    if (shape) {
      shape.completed = true
    }

    const allCompleted = shapes.every(s => s.completed)
    let pieceExtracted = false
    let phaseCompleted = false

    if (allCompleted) {
      phaseCompleted = true
      if (this.currentPhase < 3) {
        this.currentPhase++
      } else {
        pieceExtracted = true
        this.pauseTimer()
      }
    }

    return { phaseCompleted, pieceExtracted }
  }

  startTimer(onTick, onTimeout) {
    this.onTick = onTick
    this.onTimeout = onTimeout
    
    this.resumeTimer()
  }

  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  resumeTimer() {
    if (this.timerInterval) return
    
    this.timerInterval = setInterval(() => {
      this.timeRemaining -= 100 // 100ms ticks for smoothness
      
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0
        this.pauseTimer()
        if (this.onTimeout) this.onTimeout()
      } else {
        if (this.onTick) this.onTick(this.timeRemaining)
      }
    }, 100)
  }

  applyErrorPenalty() {
    this.timeRemaining -= GAME.ERROR_PENALTY_SECONDS * 1000
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0
      this.pauseTimer()
      if (this.onTimeout) this.onTimeout()
    } else {
      if (this.onTick) this.onTick(this.timeRemaining)
    }
  }
}
