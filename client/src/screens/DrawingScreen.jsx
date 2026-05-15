import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhaseManager } from '../game/PhaseManager'
import { DifficultyManager } from '../game/DifficultyManager'
import { ShapeRecognizer } from '../drawing/ShapeRecognizer'
import DrawingCanvas from '../components/DrawingCanvas'
import { useSocket } from '../hooks/useSocket'
import { GAME } from '@/shared/constants'
import { audio } from '../lib/audio'
import { Button } from '@/components/ui/button'
import ConfirmForfeitDialog from '../components/ConfirmForfeitDialog'

// Pseudo-random bounding box generator for SVGs
function generateShapePositions(shapes) {
  const positions = []
  const shapeSizePercent = 15 // Assuming shape is about 15% of the container size
  const marginPercent = 5

  shapes.forEach(shape => {
    let placed = false
    let attempts = 0
    let px, py

    while (!placed && attempts < 50) {
      px = Math.random() * (100 - shapeSizePercent - marginPercent * 2) + marginPercent
      // Keep away from top HUD (approx top 15%)
      py = Math.random() * (100 - shapeSizePercent - 15 - marginPercent) + 15

      // Check overlap
      const overlap = positions.some(p => {
        return Math.hypot(p.px - px, p.py - py) < shapeSizePercent + 2 // 2% buffer
      })

      if (!overlap) placed = true
      attempts++
    }

    positions.push({ ...shape, px, py })
  })

  return positions
}

export default function DrawingScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { socket } = useSocket()
  
  // Extract info passed from TowerScreen
  const pieceInfo = location.state || { layer: 0, position: 1, layers: null } // Fallback
  const pieceInfoRef = useRef({ layer: pieceInfo.layer, position: pieceInfo.position })

  const [timeRemaining, setTimeRemaining] = useState(GAME.TIMER_SECONDS * 1000)
  const [currentPhase, setCurrentPhase] = useState(1)
  const [shapesInfo, setShapesInfo] = useState([])
  const [flashError, setFlashError] = useState(false)
  const [showCollapse, setShowCollapse] = useState(false)
  const [showForfeitDialog, setShowForfeitDialog] = useState(false)

  // Keep references to our game logic
  const pmRef = useRef(null)
  const recognizerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!socket) return

    // Ensure we sync game state if we refreshed
    socket.emit('request_sync')

    const onGameOver = (data) => {
      navigate('/summary', { state: { summary: data?.summary, reason: data?.reason } })
    }
    
    const onGameStarted = (data) => {
      if (data.activeChallenge && data.tower) {
        // Recover piece info
        const layer = data.activeChallenge.layer;
        const position = data.activeChallenge.pos;
        const layers = data.tower.layers;
        
        pieceInfoRef.current = { layer, position };

        // Re-initialize difficulty if missing
        if (!difficultyParams) {
          const piece = layers[layer].pieces[position];
          const diff = DifficultyManager.calculateOverallDifficulty(piece, layers, layer);
          const params = DifficultyManager.getDifficultyParams(diff);
          setDifficultyParams(params);
        }
      }
    }

    socket.on('game_started', onGameStarted)
    socket.on('game_over', onGameOver)
    return () => {
      socket.off('game_over', onGameOver)
      socket.off('game_started', onGameStarted)
    }
  }, [socket, navigate, difficultyParams])

  useEffect(() => {
    // Initialize Game Logic
    let difficulty = GAME.DIFFICULTY.EASY
    if (pieceInfo.layers) {
      difficulty = DifficultyManager.getDifficulty(pieceInfo.position, pieceInfo.layer, pieceInfo.layers)
    }
    
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
    const layout = generateShapePositions(phaseShapes)
    setShapesInfo(layout)

    if (socket) {
      socket.emit('phase_update', { phase: currentPhase, totalPhases: 3, shapes: layout })
    }
  }, [currentPhase, socket])

  // Listen for sync requests from watcher
  useEffect(() => {
    if (!socket) return
    const onPhaseSyncReq = () => {
      socket.emit('phase_update', { phase: currentPhase, totalPhases: 3, shapes: shapesInfo })
    }
    socket.on('request_phase_sync', onPhaseSyncReq)
    return () => socket.off('request_phase_sync', onPhaseSyncReq)
  }, [socket, currentPhase, shapesInfo])

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

    // Calculate drawn center using normalized coordinates (nx, ny)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    strokes.forEach(stroke => stroke.forEach(pt => {
      // Fallback to absolute if normalized not available
      const x = pt.nx !== undefined ? pt.nx * 100 : pt.x
      const y = pt.ny !== undefined ? pt.ny * 100 : pt.y
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }))
    const drawCenterNx = (minX + maxX) / 2
    const drawCenterNy = (minY + maxY) / 2

    // Which shapes are we looking for? (Filter only shapes that are near the drawing center)
    const pendingNearShapes = shapesInfo.filter(s => {
      if (s.completed) return false
      // Center of the shape is px + 7.5, py + 7.5 (since size is 15%)
      const dist = Math.hypot(drawCenterNx - (s.px + 7.5), drawCenterNy - (s.py + 7.5))
      return dist < 15 // Tolerance radius in percentage
    })

    const pendingNames = pendingNearShapes.map(s => s.type)
    const match = pendingNames.length > 0 ? recognizerRef.current.recognize(strokes, pendingNames) : null
    
    if (match) {
      // Find the ID of the matched shape type
      const shapeToComplete = pendingNearShapes.find(s => s.type === match.name)
      
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
            socket.emit('piece_extracted', { layer: pieceInfoRef.current.layer, pos: pieceInfoRef.current.position })
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

  const handleDevSkipPhase = () => {
    // Force complete all pending shapes
    const pendingShapes = shapesInfo.filter(s => !s.completed)
    if (pendingShapes.length > 0) {
      pendingShapes.forEach((shape, idx) => {
        if (socket) socket.emit('drawing_result', { valid: true, shapeId: shape.id })
        
        // Mark visually
        setShapesInfo(prev => prev.map(s => s.id === shape.id ? { ...s, completed: true } : s))
        
        const isLast = idx === pendingShapes.length - 1
        const res = pmRef.current.completeShape(shape.id)
        
        if (isLast) {
          if (res.pieceExtracted) {
            if (socket) socket.emit('piece_extracted', { layer: pieceInfoRef.current.layer, pos: pieceInfoRef.current.position })
            navigate('/tower', { replace: true })
          } else if (res.phaseCompleted) {
            setCurrentPhase(pmRef.current.getCurrentPhase())
          }
        }
      })
      audio.play('correct')
    }
  }

  // Format time (ms to SS.s)
  const seconds = (timeRemaining / 1000).toFixed(1)

  const handleForfeit = () => {
    if (socket) socket.emit('forfeit')
  }

  // Calculate completed text
  const totalShapes = shapesInfo.length
  const completedShapes = shapesInfo.filter(s => s.completed).length

  return (
    <div 
      ref={containerRef}
      className={`relative h-svh w-full overflow-hidden transition-colors duration-150 ${flashError ? 'bg-red-200' : 'bg-amber-50'}`}
    >
      {/* Forfeit Button */}
      <div className="absolute bottom-4 left-4 z-30">
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => setShowForfeitDialog(true)}
          className="shadow-lg font-bold opacity-80 hover:opacity-100 p-4 sm:p-2"
        >
          <span className="text-xl sm:text-base mr-1">🏳️</span> 
          <span className="text-base sm:text-sm">Rendirse</span>
        </Button>
      </div>

      {/* Top HUD */}
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between p-4 bg-background/50 backdrop-blur-md shadow-sm pointer-events-none">
        
        {/* Phase Indicator */}
        <div className="text-2xl sm:text-xl font-bold bg-white/80 px-4 py-2 rounded-xl shadow-sm text-pastel-purple">
          {t('drawing.phase', 'Fase')} {currentPhase}/3
        </div>

        {/* Timer */}
        <div className={`text-3xl sm:text-2xl font-black ${timeRemaining <= 5000 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
          {seconds}s
        </div>

        {/* Progress Tracker */}
        <div className="text-2xl sm:text-xl font-bold bg-white/80 px-4 py-2 rounded-xl shadow-sm text-pastel-blue">
          {completedShapes}/{totalShapes || 3}
        </div>
      </div>

      {import.meta.env.DEV && (
        <div className="absolute left-4 top-24 z-30">
          <Button 
            variant="default"
            size="sm"
            onClick={handleDevSkipPhase}
            className="bg-purple-500 hover:bg-purple-600 shadow-xl font-bold text-white"
          >
            🛠️ DEV: Saltar Fase
          </Button>
        </div>
      )}

      {/* Game Area Wrapper - Full screen on mobile, capped on desktop */}
      <div className="absolute inset-0 top-16 bottom-16 mx-auto w-full max-w-[800px] bg-white/40 overflow-hidden touch-none" ref={containerRef}>
        
        {/* SVG Container (Layer below canvas) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {shapesInfo.map(shape => (
            <img
              src={`/assets/shapes/${shape.type}.svg`}
              alt={shape.type}
              key={shape.id}
              className={`absolute transition-all duration-500 ${shape.completed ? 'scale-150 opacity-0' : 'scale-100 opacity-20'}`}
              style={{ 
                left: `${shape.px}%`, 
                top: `${shape.py}%`,
                width: '15%',
                height: '15%'
              }}
            />
          ))}
        </div>

        {/* Canvas */}
        {!showCollapse && (
          <DrawingCanvas onStrokeComplete={handleStrokeComplete} onStrokePoint={handleStrokePoint} disabled={showCollapse} />
        )}
      </div>

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
      
      <ConfirmForfeitDialog 
        open={showForfeitDialog} 
        onOpenChange={setShowForfeitDialog} 
        onConfirm={handleForfeit} 
      />
    </div>
  )
}
