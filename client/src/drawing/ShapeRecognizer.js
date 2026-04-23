import { PDollarRecognizer, Point } from './pdollar'
import { templates } from './shapes'

const THRESHOLD = 0.10

export class ShapeRecognizer {
  constructor() {
    this.recognizer = new PDollarRecognizer()
    for (let t of templates) {
      this.recognizer.AddGesture(t.Name, t.Points)
    }
  }

  /**
   * Recognizes the given shape against a list of pending shape names.
   * @param {Array<Array<{x: number, y: number}>>} strokes - Arrays of points representing each stroke
   * @param {Array<string>} pendingShapeNames - List of names of shapes that are currently pending in the phase
   * @returns {{ name: string, score: number } | null} The matched shape and score, or null if no valid match
   */
  recognize(strokes, pendingShapeNames) {
    if (!strokes || strokes.length === 0) return null

    // Convert multi-stroke to a single array of Points with stroke IDs
    const points = []
    let strokeId = 1
    
    for (const stroke of strokes) {
      if (stroke.length === 0) continue
      for (const pt of stroke) {
        points.push(new Point(pt.x, pt.y, strokeId))
      }
      strokeId++
    }

    if (points.length === 0) return null

    // Filter templates to only include pending shapes
    const activeTemplates = this.recognizer.PointClouds.filter(t => pendingShapeNames.includes(t.Name))
    
    if (activeTemplates.length === 0) return null

    // Recognize against active templates
    const result = this.recognizer.Recognize(points, activeTemplates)
    
    if (result) {
      console.log(`[ShapeRecognizer] Detected: ${result.Name} with Score: ${result.Score.toFixed(3)}`)
    }
    
    if (result && result.Score >= THRESHOLD) {
      // Final check to make absolutely sure it's in the pending list
      if (pendingShapeNames.includes(result.Name)) {
        return {
          name: result.Name,
          score: result.Score
        }
      }
    }

    return null
  }
}
