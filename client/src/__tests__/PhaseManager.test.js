import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PhaseManager } from '../game/PhaseManager'
import { GAME } from '@/shared/constants'

describe('PhaseManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize correctly for EASY difficulty', () => {
    const pm = new PhaseManager(GAME.DIFFICULTY.EASY)
    expect(pm.getCurrentPhase()).toBe(1)
    expect(pm.getTimeRemaining()).toBe(GAME.TIMER_SECONDS * 1000)
    
    // Easy always has 3 shapes per phase
    const shapes = pm.getCurrentPhaseShapes()
    expect(shapes.length).toBe(3)
  })

  it('should generate valid shape definitions', () => {
    const pm = new PhaseManager(GAME.DIFFICULTY.MEDIUM)
    const shapes = pm.getCurrentPhaseShapes()
    
    expect(shapes.length).toBeGreaterThanOrEqual(4)
    expect(shapes.length).toBeLessThanOrEqual(5)
    
    shapes.forEach(shape => {
      expect(shape).toHaveProperty('id')
      expect(shape).toHaveProperty('type')
      expect(shape).toHaveProperty('completed', false)
    })
  })

  it('should complete shapes and advance phase', () => {
    const pm = new PhaseManager(GAME.DIFFICULTY.EASY)
    const shapes = pm.getCurrentPhaseShapes()
    
    expect(pm.getCurrentPhase()).toBe(1)
    
    // Complete first 2
    let result = pm.completeShape(shapes[0].id)
    expect(result.phaseCompleted).toBe(false)
    expect(result.pieceExtracted).toBe(false)
    
    result = pm.completeShape(shapes[1].id)
    expect(result.phaseCompleted).toBe(false)
    
    // Complete last one -> advance phase
    result = pm.completeShape(shapes[2].id)
    expect(result.phaseCompleted).toBe(true)
    expect(result.pieceExtracted).toBe(false)
    expect(pm.getCurrentPhase()).toBe(2)
  })

  it('should extract piece after finishing phase 3', () => {
    const pm = new PhaseManager(GAME.DIFFICULTY.EASY)
    
    for (let phase = 1; phase <= 3; phase++) {
      const shapes = pm.getCurrentPhaseShapes()
      shapes.forEach((shape, index) => {
        const result = pm.completeShape(shape.id)
        if (phase === 3 && index === shapes.length - 1) {
          expect(result.phaseCompleted).toBe(true)
          expect(result.pieceExtracted).toBe(true)
        } else if (index === shapes.length - 1) {
          expect(result.phaseCompleted).toBe(true)
          expect(result.pieceExtracted).toBe(false)
        }
      })
    }
  })

  it('should handle timer ticks', () => {
    const onTick = vi.fn()
    const onTimeout = vi.fn()
    
    const pm = new PhaseManager(GAME.DIFFICULTY.EASY)
    pm.startTimer(onTick, onTimeout)
    
    vi.advanceTimersByTime(1000)
    expect(onTick).toHaveBeenCalled()
    expect(pm.getTimeRemaining()).toBeLessThan(GAME.TIMER_SECONDS * 1000)
    
    pm.pauseTimer()
    vi.advanceTimersByTime(1000) // Shouldn't tick further
    expect(pm.getTimeRemaining()).toBe(GAME.TIMER_SECONDS * 1000 - 1000)
  })

  it('should trigger timeout', () => {
    const onTick = vi.fn()
    const onTimeout = vi.fn()
    
    const pm = new PhaseManager(GAME.DIFFICULTY.EASY)
    pm.startTimer(onTick, onTimeout)
    
    vi.advanceTimersByTime(GAME.TIMER_SECONDS * 1000 + 1000)
    expect(onTimeout).toHaveBeenCalled()
  })

  it('should apply penalty', () => {
    const pm = new PhaseManager(GAME.DIFFICULTY.EASY)
    const initialTime = pm.getTimeRemaining()
    pm.applyErrorPenalty()
    
    expect(pm.getTimeRemaining()).toBe(initialTime - GAME.ERROR_PENALTY_SECONDS * 1000)
  })

  it('should trigger timeout if penalty reduces time below 0', () => {
    const onTick = vi.fn()
    const onTimeout = vi.fn()
    
    const pm = new PhaseManager(GAME.DIFFICULTY.EASY)
    pm.startTimer(onTick, onTimeout)
    
    // Fast forward to near end
    vi.advanceTimersByTime((GAME.TIMER_SECONDS - 2) * 1000)
    
    pm.applyErrorPenalty() // Subtracts 4 seconds, bringing it below 0
    expect(onTimeout).toHaveBeenCalled()
    expect(pm.getTimeRemaining()).toBe(0)
  })
})
