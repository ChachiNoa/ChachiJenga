import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSocket } from '../hooks/useSocket'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export default function DisconnectDialog() {
  const { t } = useTranslation()
  const { socket } = useSocket()
  const [open, setOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)

  useEffect(() => {
    if (!socket) return

    let timerInterval = null

    const onOpponentDisconnected = () => {
      setOpen(true)
      setTimeLeft(30)
      
      timerInterval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    const onOpponentReconnected = () => {
      setOpen(false)
      if (timerInterval) clearInterval(timerInterval)
    }

    socket.on('opponent_disconnected', onOpponentDisconnected)
    socket.on('opponent_reconnected', onOpponentReconnected)

    return () => {
      socket.off('opponent_disconnected', onOpponentDisconnected)
      socket.off('opponent_reconnected', onOpponentReconnected)
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [socket])

  // Prevent user from closing it by clicking outside by capturing the event or just not providing close button
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md pointer-events-none" hideClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            {t('game.waitingOpponent', 'Esperando al rival...')}
          </DialogTitle>
          <DialogDescription>
            {t('game.opponentDisconnectedDesc', 'El rival se ha desconectado. Esperaremos a que se reconecte...')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl font-black text-amber-500 animate-pulse">
            {timeLeft}s
          </div>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            {t('game.forfeitWarning', 'Si no vuelve a tiempo, ganarás por abandono.')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
