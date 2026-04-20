import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import StrokeViewer from '../components/StrokeViewer'
import { useSocket } from '../hooks/useSocket'
import { GAME } from '../../../shared/constants'

export default function WatchScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { socket } = useSocket()
  
  const [currentPhase, setCurrentPhase] = useState(1)
  const [shapesInfo, setShapesInfo] = useState([])
  const [activeStrokes, setActiveStrokes] = useState([])
  const [currentLine, setCurrentLine] = useState([])
  
  // Basic mock timer since we only watch
  const [timeRemaining, setTimeRemaining] = useState(GAME.TIMER_SECONDS * 1000)

  useEffect(() => {
    if (!socket) return;

    const onPhaseUpdate = (data) => {
      setCurrentPhase(data.phase)
      setShapesInfo(data.shapes)
      setActiveStrokes([]) // Clear strokes on phase switch
      setCurrentLine([])
    }

    const onStrokePoint = (pt) => {
      if (pt.isStart) {
        setCurrentLine([pt])
      } else {
        setCurrentLine(prev => [...prev, pt])
      }
    }

    const onStrokeComplete = ({ strokes }) => {
      setActiveStrokes(strokes) // Replace or append? The sender sends all strokes inside current shape attempt
      setCurrentLine([])
    }

    const onDrawingResult = (data) => {
      if (data.valid && data.shapeId) {
        // Mark shape as completed
        setShapesInfo(prev => prev.map(s => s.id === data.shapeId ? { ...s, completed: true } : s))
        // Clear active drawing
        setActiveStrokes([])
        setCurrentLine([])
      } else if (!data.valid) {
        // Opponent failed, flash red (optional)
        setActiveStrokes([]) // Start over
      }
    }

    const onPieceExtracted = () => {
      // Opponent completed all phases!
      navigate('/tower', { replace: true }) // Navigate back to tower, the Tower component should re-fetch state or use updated state
    }
    
    const onGameOver = (data) => {
      navigate('/summary', { state: { summary: data?.summary, reason: data?.reason } })
    }

    socket.on('opponent_phase_update', onPhaseUpdate)
    socket.on('opponent_stroke', onStrokePoint)
    socket.on('opponent_stroke_complete', onStrokeComplete)
    socket.on('opponent_drawing_result', onDrawingResult)
    socket.on('piece_extracted', onPieceExtracted)
    socket.on('game_over', onGameOver)

    return () => {
      socket.off('opponent_phase_update', onPhaseUpdate)
      socket.off('opponent_stroke', onStrokePoint)
      socket.off('opponent_stroke_complete', onStrokeComplete)
      socket.off('opponent_drawing_result', onDrawingResult)
      socket.off('piece_extracted', onPieceExtracted)
      socket.off('game_over', onGameOver)
    }
  }, [socket, navigate])

  // Simple local fallback timer
  useEffect(() => {
    const intv = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 100))
    }, 100)
    return () => clearInterval(intv)
  }, [])

  const seconds = (timeRemaining / 1000).toFixed(1)
  const totalShapes = shapesInfo.length
  const completedShapes = shapesInfo.filter(s => s.completed).length

  return (
    <div className="relative h-svh w-full overflow-hidden bg-sky-50 transition-colors duration-150">
      {/* Top HUD */}
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between p-4 bg-background/50 backdrop-blur-md shadow-sm pointer-events-none">
        
        <div className="text-xl font-bold bg-white/80 px-4 py-2 rounded-xl shadow-sm text-pastel-purple">
          {t('drawing.phase', 'Fase')} {currentPhase}/3
        </div>

        <div className="text-xl font-black text-muted-foreground/80">
          👀 {t('drawing.watching', 'Observando')}
        </div>

        <div className="text-xl font-bold bg-white/80 px-4 py-2 rounded-xl shadow-sm text-pastel-blue">
          {completedShapes}/{totalShapes || 3}
        </div>
      </div>

      {/* Shapes Container */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {shapesInfo.map(shape => (
          <img
            src={`/assets/shapes/${shape.type}.svg`}
            alt={shape.type}
            key={shape.id}
            className={`absolute transition-all duration-500 ${shape.completed ? 'scale-150 opacity-0' : 'scale-100 opacity-20 filter grayscale'}`}
            style={{ 
              left: shape.x, 
              top: shape.y,
              width: 80,
              height: 80
            }}
          />
        ))}
      </div>

      <StrokeViewer strokes={activeStrokes} currentLine={currentLine} />
    </div>
  )
}
