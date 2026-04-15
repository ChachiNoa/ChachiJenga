import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Tower from '../components/Tower'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

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
  
  const [layers, setLayers] = useState(createMockLayers())
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  
  // Mock game state for UI demonstration
  const [gameState, setGameState] = useState({
    me: { name: 'Player 1', points: 0, isTurn: true },
    opponent: { name: 'Player 2', points: 0, isTurn: false }
  })

  // Start with player at bottom of canvas
  
  const handleSelectPiece = (layer, position) => {
    if (!gameState.me.isTurn) return
    
    setSelectedPiece({ layer, position })
    setConfirmOpen(true)
  }

  const handleConfirmExtraction = () => {
    setConfirmOpen(false)
    // Navigate to drawing screen, passing the selected piece
    navigate('/drawing', { state: { layer: selectedPiece.layer, position: selectedPiece.position } })
  }

  return (
    <div className="flex h-svh w-full flex-col bg-gradient-to-b from-sky-100 to-amber-50 overflow-hidden">
      
      {/* Top HUD */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between p-4">
        <PlayerAvatar 
          name={gameState.me.name} 
          isMyTurn={gameState.me.isTurn} 
          points={gameState.me.points} 
        />
        
        <div className="rounded-full bg-background/80 px-4 py-1.5 shadow-sm backdrop-blur-sm">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">
            {gameState.me.isTurn ? t('game.yourTurn') : t('game.opponentTurn')}
          </span>
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
          interactive={gameState.me.isTurn && !confirmOpen}
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
