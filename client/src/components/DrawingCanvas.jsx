import React, { useRef, useEffect, useState } from 'react'

export default function DrawingCanvas({ onStrokeComplete, disabled = false }) {
  const canvasRef = useRef(null)
  
  // A stroke is an array of points: {x, y}
  // All active strokes for the current shape attempt
  const [currentStrokes, setCurrentStrokes] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentLine, setCurrentLine] = useState([])

  const recognitionTimeoutRef = useRef(null)

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
    ctx.strokeStyle = '#4A3B32' // Dark pastel brown
  }, [])

  useEffect(() => {
    // Redraw
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw previous strokes
    currentStrokes.forEach(stroke => {
      if (stroke.length < 2) return
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y)
      }
      ctx.stroke()
    })

    // Draw current line
    if (currentLine.length >= 2) {
      ctx.beginPath()
      ctx.moveTo(currentLine[0].x, currentLine[0].y)
      for (let i = 1; i < currentLine.length; i++) {
        ctx.lineTo(currentLine[i].x, currentLine[i].y)
      }
      ctx.stroke()
    }
  }, [currentStrokes, currentLine])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    // Handle both touch and mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const handleStart = (e) => {
    if (disabled) return
    e.preventDefault()

    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current)
    }

    setIsDrawing(true)
    const pt = getCoordinates(e)
    setCurrentLine([pt])
  }

  const handleMove = (e) => {
    if (!isDrawing || disabled) return
    e.preventDefault()
    
    const pt = getCoordinates(e)
    setCurrentLine(prev => [...prev, pt])
  }

  const handleEnd = (e) => {
    if (!isDrawing || disabled) return
    e.preventDefault()
    
    setIsDrawing(false)
    
    if (currentLine.length > 0) {
      const newStrokes = [...currentStrokes, currentLine]
      setCurrentStrokes(newStrokes)
      setCurrentLine([])

      // Wait 500ms for potentially more strokes (e.g. crossing a t, second part of X)
      // before sending for recognition
      recognitionTimeoutRef.current = setTimeout(() => {
        if (onStrokeComplete) {
          onStrokeComplete(newStrokes)
        }
        // Auto clear after recognition attempt
        setCurrentStrokes([])
      }, 500)
    }
  }

  return (
    <div className="absolute inset-0 z-20 touch-none">
      <canvas
        ref={canvasRef}
        className="block h-full w-full outline-none"
        onPointerDown={handleStart}
        onPointerMove={handleMove}
        onPointerUp={handleEnd}
        onPointerCancel={handleEnd}
        onPointerLeave={handleEnd}
      />
    </div>
  )
}
