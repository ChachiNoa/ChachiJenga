import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShapeRecognizer } from '../drawing/ShapeRecognizer'

// Mock the $P recognizer implementation for testing the wrapper logic
vi.mock('../drawing/pdollar', () => {
  return {
    PDollarRecognizer: class {
      Recognize = vi.fn((points, templates) => {
        // Dummy logic: if we pass a specific number of points, return fake scores
        if (points.length === 0) return { Name: 'none', Score: 0.0 }
        if (points.length === 3) return { Name: 'triangle', Score: 0.85 }
        if (points.length === 4) return { Name: 'square', Score: 0.75 }
        return { Name: 'circle', Score: 0.65 } // Low score
      })
    },
    Point: function(x, y, id) {
      this.X = x
      this.Y = y
      this.ID = id
    }
  }
})


describe('ShapeRecognizer', () => {
  let recognizer

  beforeEach(() => {
    recognizer = new ShapeRecognizer()
  })

  it('should return null for empty strokes', () => {
    const result = recognizer.recognize([], ['triangle'])
    expect(result).toBeNull()
  })

  it('should ignore results below confidence threshold (70%)', () => {
    // 2 points returns 'circle' with 0.65 score based on our mock
    const strokes = [[{x: 0, y: 0}, {x: 1, y: 1}]]
    const result = recognizer.recognize(strokes, ['circle'])
    
    expect(result).toBeNull() // Score 0.65 is < 0.70 threshold
  })

  it('should accept results above threshold and matching pending shapes', () => {
    // 3 points returns 'triangle' with 0.85 score
    const strokes = [[{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}]]
    const result = recognizer.recognize(strokes, ['triangle', 'square'])
    
    expect(result).not.toBeNull()
    expect(result.name).toBe('triangle')
    expect(result.score).toBeGreaterThanOrEqual(0.70)
  })

  it('should reject shapes that are not in the pending list even if score is high', () => {
    // 3 points returns 'triangle', but only 'square' and 'circle' are pending
    const strokes = [[{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}]]
    const result = recognizer.recognize(strokes, ['square', 'circle'])
    
    expect(result).toBeNull()
  })

  it('should match multiple strokes correctly combining them into one point cloud', () => {
    const strokes = [
      [{x: 0, y: 0}, {x: 1, y: 1}], // 2 points
      [{x: 2, y: 2}, {x: 3, y: 3}]  // 2 points total = 4 points -> 'square'
    ]
    const result = recognizer.recognize(strokes, ['square'])
    
    expect(result).not.toBeNull()
    expect(result.name).toBe('square')
  })
})
