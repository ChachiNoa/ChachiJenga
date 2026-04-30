import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import Tower from '../components/Tower'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useSocket } from '../hooks/useSocket'
import { audio } from '../lib/audio'

// Mock initial layers since we don't have socket connection yet
const createMockLayers = () => {
  const layers = []
  for (let i = 0; i < 18; i++) {
    layers.push({
      index: i,
      orientation: i % 2 === 0 ? 'horizontal' : 'vertical',
      pieces: [
        { position: 0, present: true },
        { position: 1, present: true },
        { position: 2, present: true },
      ],
    })
  }
  return layers
}

function PlayerAvatar({ name, isMyTurn, points, avatarUrl }) {
  const initials = name ? name.substring(0, 2).toUpperCase() : '?'
  
  return (
    <div className={`flex flex-col items-center gap-1 ${isMyTurn ? 'opacity-100 scale-110' : 'opacity-60 scale-95'} transition-all`}>
      <div className={`relative rounded-full p-1 ${isMyTurn ? 'bg-primary' : 'bg-transparent'}`}>
        <Avatar className="h-12 w-12 border-2 border-background">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
      <span className="text-xs font-bold text-foreground">{name}</span>
      <span className="text-sm font-black text-primary">{points} pts</span>
    </div>
  )
}

function TowerScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { socket } = useSocket()
  
  // Try to use real data from router if available
  const initialData = location.state?.gameData;
  const isMyTurnInitially = socket && initialData ? initialData.turn === socket.id : true;

  const [layers, setLayers] = useState(initialData && initialData.tower ? initialData.tower.layers : createMockLayers())
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectionEndTime, setSelectionEndTime] = useState(initialData?.selectionEndTime || null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [isMyTurn, setIsMyTurn] = useState(initialData && socket ? initialData.turn === socket.id : false)
  
  // Real or Mock game state for UI demonstration
  const [gameState, setGameState] = useState({
    me: { name: 'Me', points: 0, isTurn: initialData && socket ? initialData.turn === socket.id : false },
    opponent: { name: 'Opponent', points: 0, isTurn: initialData && socket ? initialData.turn !== socket.id : false }
  })

  useEffect(() => {
    if (!selectionEndTime) return
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((selectionEndTime - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [selectionEndTime])

  useEffect(() => {
    if (!socket) return

    // Immediately request the true game state when this screen mounts
    socket.emit('request_sync')

    const onTurnChanged = (data) => {
      const myTurn = data.turn === socket.id
      setIsMyTurn(myTurn)
      if (data.selectionEndTime) {
        setSelectionEndTime(data.selectionEndTime)
      }
      setGameState(prev => ({
        me: { ...prev.me, isTurn: myTurn },
        opponent: { ...prev.opponent, isTurn: !myTurn }
      }))
    }

    const onChallengeStarted = ({ layer, pos, player }) => {
      setSelectionEndTime(null) // Challenge started, stop selection timer
      if (player !== socket.id) {
        // Opponent started the challenge, go to watch
        navigate('/watch', { replace: true })
      }
    }
    
    // Server emits piece_extracted, we reload tower visually from a resync event,
    // but we can also get a full game_started payload which resyncs everything.
    const onGameStartedResync = (data) => {
      setLayers(data.tower.layers)
      onTurnChanged(data)
    }

    const onPieceExtracted = (data) => {
      // Just request full sync to update the tower blocks correctly
      socket.emit('request_sync')
    }

    const onGameOver = (data) => {
      navigate('/summary', { state: { summary: data?.summary, reason: data?.reason } })
    }

    socket.on('turn_changed', onTurnChanged)
    socket.on('challenge_started', onChallengeStarted)
    socket.on('game_started', onGameStartedResync)
    socket.on('piece_extracted', onPieceExtracted)
    socket.on('game_over', onGameOver)

    return () => {
      socket.off('turn_changed', onTurnChanged)
      socket.off('challenge_started', onChallengeStarted)
      socket.off('game_started', onGameStartedResync)
      socket.off('piece_extracted', onPieceExtracted)
      socket.off('game_over', onGameOver)
    }
  }, [socket, navigate])

  // Start with player at bottom of canvas
  
  const handleSelectPiece = (layer, position) => {
    if (!isMyTurn) return
    audio.play('select')
    audio.vibrate([30])
    setSelectedPiece({ layer, position })
    setConfirmOpen(true)
  }

  const handleConfirmExtraction = () => {
    setConfirmOpen(false)
    if (socket) {
      socket.emit('select_piece', { layer: selectedPiece.layer, pos: selectedPiece.position })
    }
    // Navigate to drawing screen, passing the selected piece and current tower state
    navigate('/drawing', { state: { layer: selectedPiece.layer, position: selectedPiece.position, layers } })
  }

  const isDangerTime = timeLeft <= 5 && selectionEndTime

  return (
    <div className="flex h-svh w-full flex-col bg-gradient-to-b from-sky-100 to-amber-50 overflow-hidden animate-page-enter">
      
      {/* Top HUD */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between p-4">
        <PlayerAvatar 
          name={gameState.me.name} 
          isMyTurn={gameState.me.isTurn} 
          points={gameState.me.points} 
        />
        
        <div className={`rounded-full px-4 py-1.5 shadow-sm backdrop-blur-sm transition-colors ${isDangerTime ? 'bg-red-500 text-white animate-pulse' : 'bg-background/80 text-primary'}`}>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold uppercase tracking-wider">
              {gameState.me.isTurn ? t('game.yourTurn') : t('game.opponentTurn')}
            </span>
            {selectionEndTime && (
              <span className={`text-xl font-black ${isDangerTime ? 'text-white' : 'text-foreground'}`}>
                00:{timeLeft.toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>
        
        <PlayerAvatar 
          name={gameState.opponent.name} 
          isMyTurn={gameState.opponent.isTurn} 
          points={gameState.opponent.points} 
        />
      </div>

      {/* 3D Tower Canvas */}
      <div className="flex-1 w-full relative pt-16">
        <Tower 
          layers={layers} 
          onSelectPiece={handleSelectPiece} 
          interactive={isMyTurn && !confirmOpen}
        />
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[325px]">
          <DialogHeader>
            <DialogTitle>{t('game.confirmExtraction')}</DialogTitle>
            <DialogDescription>
              {t('game.confirmExtractionDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirmExtraction} className="flex-1">
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TowerScreen
