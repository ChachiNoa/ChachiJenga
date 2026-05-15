import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Swords, Loader2, X } from 'lucide-react'

/**
 * Dialog shown when a friend challenges you to a friendly match.
 */
export function ChallengeReceivedDialog({ challenge, onAccept, onReject }) {
  const [timeLeft, setTimeLeft] = useState(30)

  useEffect(() => {
    if (!challenge) return
    setTimeLeft(30)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [challenge?.challengeId])

  if (!challenge) return null

  const { challenger } = challenge

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onReject()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Swords className="h-6 w-6 text-orange-500" />
            ¡Desafío Amistoso!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-16 w-16">
            {challenger.avatarUrl && challenger.avatarUrl.length <= 4 ? (
              <AvatarFallback className="text-3xl bg-primary/10">{challenger.avatarUrl}</AvatarFallback>
            ) : (
              <AvatarFallback className="text-xl">{challenger.name?.[0] || '?'}</AvatarFallback>
            )}
          </Avatar>
          <div className="text-center">
            <p className="font-bold text-lg">{challenger.name}</p>
            <p className="text-sm text-muted-foreground">{challenger.tag} · ELO {challenger.elo}</p>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Te ha retado a una partida amistosa.<br/>
            <span className="text-orange-500 font-semibold">Sin cambios de ELO ni puntos.</span>
          </p>
          
          {/* Timer bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-orange-500 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{timeLeft}s</span>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onReject} className="flex-1 gap-2">
            <X className="h-4 w-4" /> Rechazar
          </Button>
          <Button onClick={onAccept} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white">
            <Swords className="h-4 w-4" /> ¡Aceptar!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Small toast/indicator shown to the challenger while waiting for response.
 */
export function ChallengeSentIndicator({ targetName, onCancel }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border-2 border-orange-400 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-slide-up">
      <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
      <div>
        <p className="font-semibold text-sm">Esperando a {targetName}...</p>
        <p className="text-xs text-muted-foreground">Partida amistosa sin ELO</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
        Cancelar
      </Button>
    </div>
  )
}
