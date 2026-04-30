import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, TrendingUp, TrendingDown, Target, Loader2, Home, RotateCcw } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { audio } from '../lib/audio'

export default function SummaryScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { socket } = useSocket()
  
  const [data, setData] = useState(location.state?.summary || null)
  const [reason, setReason] = useState(location.state?.reason || '')

  useEffect(() => {
    // If user refreshes or visits directly
    if (!data) {
      navigate('/home', { replace: true })
      return
    }
    // Play result sound
    if (data.result === 'VICTORY') {
      audio.play('victory')
      audio.vibrate([100, 50, 100, 50, 200])
    } else if (data.result === 'DEFEAT' || data.result === 'FORFEIT') {
      audio.play('defeat')
    }
  }, [data, navigate])

  if (!data) return null

  const isVictory = data.result === 'VICTORY'
  const isDraw = data.result === 'DRAW'
  const isDefeat = data.result === 'DEFEAT' || data.result === 'FORFEIT'

  const bgColor = isVictory ? 'from-green-100 to-emerald-50' : isDraw ? 'from-amber-100 to-yellow-50' : 'from-red-100 to-orange-50'
  const titleColor = isVictory ? 'text-green-600' : isDraw ? 'text-amber-600' : 'text-red-500'
  const resultTitle = isVictory ? t('summary.victory', '¡Victoria!') : isDraw ? t('summary.draw', 'Empate') : t('summary.defeat', 'Derrota')

  return (
    <div className={`flex min-h-svh flex-col items-center justify-center p-6 bg-gradient-to-br ${bgColor} animate-page-enter`}>
      <div className="w-full max-w-sm flex flex-col gap-6 flex-1 justify-center">
        
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl animate-bounce-in">
            {isVictory && <Trophy className="h-12 w-12 text-yellow-500 animate-bounce" />}
            {isDraw && <Target className="h-12 w-12 text-amber-500" />}
            {isDefeat && <Trophy className="h-12 w-12 text-zinc-300 opacity-50 rotate-180" />}
          </div>
          <h1 className={`text-4xl font-black ${titleColor}`}>{resultTitle}</h1>
          <p className="mt-2 text-muted-foreground font-medium uppercase tracking-wider text-sm">
            {reason === 'COLLAPSE' && t('summary.reasonCollapse', 'La torre se derrumbó')}
            {reason === 'FORFEIT' && t('summary.reasonForfeit', 'Abandono')}
            {reason === 'DRAW' && t('summary.reasonDraw', 'Límite de turnos')}
          </p>
        </div>

        <Card className="shadow-lg border-none">
          <CardContent className="p-6 grid gap-4">
            <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl">
              <span className="font-semibold text-muted-foreground">{t('summary.points', 'Puntos Obtenidos')}</span>
              <span className={`text-xl font-black ${data.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.points > 0 ? '+' : ''}{data.points}
              </span>
            </div>

            {data.piecesExtracted != null && (
              <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl">
                <span className="font-semibold text-muted-foreground">{t('summary.piecesExtracted', 'Piezas Extraídas')}</span>
                <span className="text-xl font-black text-pastel-purple">
                  {data.piecesExtracted}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl">
              <span className="font-semibold text-muted-foreground">{t('summary.eloChange', 'Cambio ELO')}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-black ${data.eloChange >= 0 ? 'text-pastel-blue' : 'text-red-500'}`}>
                  {data.eloChange >= 0 ? '+' : ''}{data.eloChange}
                </span>
                {data.eloChange > 0 ? <TrendingUp className="h-5 w-5 text-pastel-blue" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
              </div>
            </div>

            <div className="mt-2 text-center text-sm font-medium text-muted-foreground">
              {t('summary.newElo', 'Nuevo ELO:')} <span className="text-foreground font-bold">{data.newElo}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={() => navigate('/home', { state: { autoJoin: true } })} className="w-full h-14 text-lg rounded-xl shadow-md bg-primary hover:bg-primary/90" size="lg">
            <RotateCcw className="mr-2 h-5 w-5" />
            {t('summary.playAgain', 'Jugar de Nuevo')}
          </Button>
          <Button onClick={() => navigate('/home')} variant="outline" className="w-full h-14 text-lg rounded-xl shadow-md border-2" size="lg">
            <Home className="mr-2 h-5 w-5" />
            {t('summary.goHome', 'Ir al Menú')}
          </Button>
        </div>

      </div>
    </div>
  )
}
