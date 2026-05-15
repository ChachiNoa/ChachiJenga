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
      const startX = stroke[0].nx !== undefined ? stroke[0].nx * canvas.width : stroke[0].x
      const startY = stroke[0].ny !== undefined ? stroke[0].ny * canvas.height : stroke[0].y
      ctx.moveTo(startX, startY)
      for (let i = 1; i < stroke.length; i++) {
        const x = stroke[i].nx !== undefined ? stroke[i].nx * canvas.width : stroke[i].x
        const y = stroke[i].ny !== undefined ? stroke[i].ny * canvas.height : stroke[i].y
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    })

    // Draw current line
    if (currentLine && currentLine.length >= 2) {
      ctx.beginPath()
      const startX = currentLine[0].nx !== undefined ? currentLine[0].nx * canvas.width : currentLine[0].x
      const startY = currentLine[0].ny !== undefined ? currentLine[0].ny * canvas.height : currentLine[0].y
      ctx.moveTo(startX, startY)
      for (let i = 1; i < currentLine.length; i++) {
        const x = currentLine[i].nx !== undefined ? currentLine[i].nx * canvas.width : currentLine[i].x
        const y = currentLine[i].ny !== undefined ? currentLine[i].ny * canvas.height : currentLine[i].y
        ctx.lineTo(x, y)
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
