import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhaseManager } from '../game/PhaseManager'
import { ShapeRecognizer } from '../drawing/ShapeRecognizer'
import DrawingCanvas from '../components/DrawingCanvas'
import { useSocket } from '../hooks/useSocket'
import { GAME } from '../../../shared/constants'
import { audio } from '../lib/audio'

// Pseudo-random bounding box generator for SVGs
function generateShapePositions(shapes, screenWidth, screenHeight) {
  const positions = []
  const shapeSize = 80
  const margin = 20

  shapes.forEach(shape => {
    let placed = false
    let attempts = 0
    let x, y

    while (!placed && attempts < 50) {
      x = Math.random() * (screenWidth - shapeSize - margin * 2) + margin
      // Keep away from top HUD (100px)
      y = Math.random() * (screenHeight - shapeSize - 100 - margin) + 100

      // Check overlap
      const overlap = positions.some(p => {
        return Math.hypot(p.x - x, p.y - y) < shapeSize + 10
      })

      if (!overlap) placed = true
      attempts++
    }

    positions.push({ ...shape, x, y })
  })

  return positions
}

export default function DrawingScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { socket } = useSocket()
  
  // Extract info passed from TowerScreen
  const pieceInfo = location.state || { layer: 0, position: 1 } // Fallback

  const [timeRemaining, setTimeRemaining] = useState(GAME.TIMER_SECONDS * 1000)
  const [currentPhase, setCurrentPhase] = useState(1)
  const [shapesInfo, setShapesInfo] = useState([])
  const [flashError, setFlashError] = useState(false)
  const [showCollapse, setShowCollapse] = useState(false)

  // Keep references to our game logic
  const pmRef = useRef(null)
  const recognizerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!socket) return
    const onGameOver = (data) => {
      navigate('/summary', { state: { summary: data?.summary, reason: data?.reason } })
    }
    socket.on('game_over', onGameOver)
    return () => socket.off('game_over', onGameOver)
  }, [socket, navigate])

  useEffect(() => {
    // Initialize Game Logic
    // In a real app we'd get difficulty from DifficultyManager based on pieceInfo
    const difficulty = GAME.DIFFICULTY.EASY 
    
    pmRef.current = new PhaseManager(difficulty)
    recognizerRef.current = new ShapeRecognizer()

    const onTick = (time) => setTimeRemaining(time)
    const onTimeout = () => {
      // Time is up -> tower collapses
      // Wait for game_over from server since the server is the single source of truth for time!
      setShowCollapse(true)
    }

    pmRef.current.startTimer(onTick, onTimeout)

    return () => {
      if (pmRef.current) pmRef.current.pauseTimer()
    }
  }, [navigate])

  // When phase changes, generate new layout
  useEffect(() => {
    if (!pmRef.current || !containerRef.current) return
    
    const phaseShapes = pmRef.current.getCurrentPhaseShapes()
    const rect = containerRef.current.getBoundingClientRect()
    
    const layout = generateShapePositions(phaseShapes, rect.width || window.innerWidth, rect.height || window.innerHeight)
    setShapesInfo(layout)

    if (socket) {
      socket.emit('phase_update', { phase: currentPhase, totalPhases: 3, shapes: layout })
    }
  }, [currentPhase, socket])

  const handleStrokePoint = (pt) => {
    if (socket) {
      socket.emit('stroke_point', pt)
    }
  }

  const handleStrokeComplete = (strokes) => {
    if (!pmRef.current || !recognizerRef.current) return

    if (socket) {
      socket.emit('stroke_complete', { strokes })
    }

    // Which shapes are we looking for?
    const pendingNames = shapesInfo.filter(s => !s.completed).map(s => s.type)
    
    const match = recognizerRef.current.recognize(strokes, pendingNames)
    
    if (match) {
      // Find the ID of the matched shape type
      const shapeToComplete = shapesInfo.find(s => s.type === match.name && !s.completed)
      
      if (shapeToComplete) {
        if (socket) {
          socket.emit('drawing_result', { valid: true, shapeId: shapeToComplete.id })
        }

        // Mark visually
        setShapesInfo(prev => prev.map(s => s.id === shapeToComplete.id ? { ...s, completed: true } : s))
        audio.play('correct')
        audio.vibrate([50, 30, 50])
        
        // Mark in logic
        const { phaseCompleted, pieceExtracted } = pmRef.current.completeShape(shapeToComplete.id)
        
        if (pieceExtracted) {
          if (socket) {
            socket.emit('piece_extracted', { layer: pieceInfo.layer, pos: pieceInfo.position })
          }
          // The server will emit 'piece_extracted' or 'turn_changed' to both
          // Navigate back to tower
          navigate('/tower', { replace: true })
        } else if (phaseCompleted) {
          setCurrentPhase(pmRef.current.getCurrentPhase())
        }
      }
    } else {
      // Error
      if (socket) {
        socket.emit('drawing_result', { valid: false })
      }
      pmRef.current.applyErrorPenalty()
      audio.play('error')
      audio.vibrate([100])
      setFlashError(true)
      setTimeout(() => setFlashError(false), 300)
    }
  }

  // Format time (ms to SS.s)
  const seconds = (timeRemaining / 1000).toFixed(1)
  const isDangerTime = timeRemaining <= 10000

  // Calculate completed text
  const totalShapes = shapesInfo.length
  const completedShapes = shapesInfo.filter(s => s.completed).length

  return (
    <div 
      ref={containerRef}
      className={`relative h-svh w-full overflow-hidden transition-colors duration-150 ${flashError ? 'bg-red-200' : 'bg-amber-50'}`}
    >
      {/* Top HUD */}
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between p-4 bg-background/50 backdrop-blur-md shadow-sm pointer-events-none">
        
        {/* Phase Indicator */}
        <div className="text-xl font-bold bg-white/80 px-4 py-2 rounded-xl shadow-sm text-pastel-purple">
          {t('drawing.phase')} {currentPhase}/3
        </div>

        {/* Timer */}
        <div className={`text-4xl font-black ${isDangerTime ? 'text-red-500 animate-timer-danger' : 'text-foreground'}`}>
          {seconds}s
        </div>

        {/* Progress Tracker */}
        <div className="text-xl font-bold bg-white/80 px-4 py-2 rounded-xl shadow-sm text-pastel-blue">
          {completedShapes}/{totalShapes}
        </div>
      </div>

      {/* SVG Container (Layer below canvas) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {shapesInfo.map(shape => (
          <img
            src={`/assets/shapes/${shape.type}.svg`}
            alt={shape.type}
            key={shape.id}
            className={`absolute transition-all duration-500 ${shape.completed ? 'scale-150 opacity-0' : 'scale-100 opacity-20'}`}
            style={{ 
              left: shape.x, 
              top: shape.y,
              width: 80,
              height: 80
            }}
          />
        ))}
      </div>

      {/* Canvas */}
      {!showCollapse && (
        <DrawingCanvas onStrokeComplete={handleStrokeComplete} onStrokePoint={handleStrokePoint} disabled={showCollapse} />
      )}

      {/* Collapse Overlay */}
      {showCollapse && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center animate-in fade-in zoom-in">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-4xl font-black text-white">{t('drawing.towerCollapsed')}</h1>
            <p className="text-xl mt-2 text-white/80">{t('drawing.timeUp')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
