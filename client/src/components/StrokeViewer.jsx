import React, { useRef, useEffect } from 'react'

export default function StrokeViewer({ strokes = [], currentLine = [] }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Fit parent
    const parent = canvas.parentElement
    canvas.width = parent.clientWidth
    canvas.height = parent.clientHeight

    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 6
    ctx.strokeStyle = '#2563EB' // Blue for opponent
  }, [])

  useEffect(() => {
    // Redraw
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw previous strokes
    strokes.forEach(stroke => {
      if (stroke.length < 2) return
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y)
      }
      ctx.stroke()
    })

    // Draw current line
    if (currentLine && currentLine.length >= 2) {
      ctx.beginPath()
      ctx.moveTo(currentLine[0].x, currentLine[0].y)
      for (let i = 1; i < currentLine.length; i++) {
        ctx.lineTo(currentLine[i].x, currentLine[i].y)
      }
      ctx.stroke()
    }
  }, [strokes, currentLine])

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <canvas ref={canvasRef} className="block h-full w-full outline-none" />
    </div>
  )
}
