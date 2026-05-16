import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, TrendingUp, TrendingDown, Target, Home, RotateCcw, UserPlus } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { audio } from '../lib/audio'
import { clearGameRoute } from '../hooks/useGameSession'
import { loadAuth } from '@/network/authApi'
import UserProfilePopup from '../components/UserProfilePopup'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function SummaryScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { socket } = useSocket()
  
  const [data, setData] = useState(location.state?.summary || null)
  const [reason, setReason] = useState(location.state?.reason || '')
  const [profileUserId, setProfileUserId] = useState(null)
  const [friendRequestSent, setFriendRequestSent] = useState(false)

  useEffect(() => {
    // Game is over, clear the saved game route
    clearGameRoute()
    
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

  const handleSendFriendRequest = async () => {
    if (!data?.opponent?.tag) return
    try {
      const auth = loadAuth()
      const res = await fetch(`${API}/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ tag: data.opponent.tag })
      })
      if (res.ok) {
        setFriendRequestSent(true)
      }
    } catch (e) { console.error(e) }
  }

  if (!data) return null

  const isVictory = data.result === 'VICTORY'
  const isDraw = data.result === 'DRAW'
  const isDefeat = data.result === 'DEFEAT' || data.result === 'FORFEIT'
  const opponent = data.opponent

  const bgColor = isVictory ? 'from-green-100 to-emerald-50' : isDraw ? 'from-amber-100 to-yellow-50' : 'from-red-100 to-orange-50'
  const titleColor = isVictory ? 'text-green-600' : isDraw ? 'text-amber-600' : 'text-red-500'
  const resultTitle = isVictory ? t('summary.victory', '¡Victoria!') : isDraw ? t('summary.draw', 'Empate') : t('summary.defeat', 'Derrota')

  return (
    <>
      <div className={`flex min-h-svh flex-col items-center justify-center p-6 bg-gradient-to-br ${bgColor} animate-page-enter`}>
        <div className="w-full max-w-sm flex flex-col gap-5 flex-1 justify-center">
        
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
              {reason === 'selection_timeout' && t('summary.reasonTimeout', 'Tiempo agotado')}
            </p>
            {data.isFriendly && (
              <span className="inline-block mt-2 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                ⚔️ Partida Amistosa · Sin cambios de ELO
              </span>
            )}
          </div>

          {/* Opponent Card */}
          {opponent && (
            <Card className="shadow-md border-none bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar 
                    className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all shadow-sm" 
                    onClick={() => setProfileUserId(opponent.id)}
                  >
                    {opponent.avatarUrl && opponent.avatarUrl.length <= 4 ? (
                      <AvatarFallback className="text-2xl bg-primary/10">{opponent.avatarUrl}</AvatarFallback>
                    ) : opponent.avatarUrl ? (
                      <AvatarImage src={opponent.avatarUrl} alt={opponent.name} />
                    ) : (
                      <AvatarFallback className="text-lg">{opponent.name?.[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-bold text-sm leading-tight">{opponent.name}</div>
                    {opponent.tag && <div className="text-[10px] text-muted-foreground">{opponent.tag}</div>}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {isVictory ? '😎 Oponente derrotado' : isDefeat ? '💪 Te venció' : '🤝 Empate'}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={friendRequestSent ? undefined : handleSendFriendRequest}
                  disabled={friendRequestSent}
                  className={`gap-1.5 h-9 text-xs font-bold rounded-xl shadow-sm ${friendRequestSent ? 'bg-green-50 text-green-700 border-green-200' : 'hover:bg-primary/5'}`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {friendRequestSent ? '✓ Enviada' : 'Añadir'}
                </Button>
              </CardContent>
            </Card>
          )}

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

              {!data.isFriendly && (
                <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl">
                  <span className="font-semibold text-muted-foreground">{t('summary.eloChange', 'Cambio ELO')}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-black ${data.eloChange >= 0 ? 'text-pastel-blue' : 'text-red-500'}`}>
                      {data.eloChange >= 0 ? '+' : ''}{data.eloChange}
                    </span>
                    {data.eloChange > 0 ? <TrendingUp className="h-5 w-5 text-pastel-blue" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
                  </div>
                </div>
              )}

              {!data.isFriendly && (
                <div className="mt-2 text-center text-sm font-medium text-muted-foreground">
                  {t('summary.newElo', 'Nuevo ELO:')} <span className="text-foreground font-bold">{data.newElo}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 mt-2">
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

      {/* User Profile Popup */}
      <UserProfilePopup
        open={!!profileUserId}
        onOpenChange={(v) => !v && setProfileUserId(null)}
        userId={profileUserId}
        showFriendButton={true}
      />
    </>
  )
}
