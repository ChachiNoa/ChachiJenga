import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Trophy, Puzzle, Pencil, Star, TrendingUp, XCircle, Minus, UserPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadAuth } from '@/network/authApi'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function StatItem({ icon: Icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-2.5">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-base font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  )
}

/**
 * Reusable popup to show any user's full profile stats.
 * 
 * Props:
 * - open: boolean
 * - onOpenChange: (open) => void
 * - userId: number|string - the user ID to fetch profile for
 * - onSendFriendRequest: (userId, displayName) => void (optional)
 * - showFriendButton: boolean (optional, default false)
 */
export default function UserProfilePopup({ open, onOpenChange, userId, onSendFriendRequest, showFriendButton = false }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    setRequestSent(false)
    fetch(`${API}/api/profile/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data?.user) setProfile(data)
      })
      .catch(e => console.error('[UserProfilePopup]', e))
      .finally(() => setLoading(false))
  }, [open, userId])

  const user = profile?.user
  const isMe = user && loadAuth()?.user?.id === user.id

  const handleSendRequest = async () => {
    if (!user?.tag) return
    try {
      const auth = loadAuth()
      const res = await fetch(`${API}/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ tag: user.tag })
      })
      if (res.ok) {
        setRequestSent(true)
        if (onSendFriendRequest) onSendFriendRequest(userId, user.displayName)
      }
    } catch (e) { console.error(e) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Usuario no encontrado
          </div>
        ) : (
          <>
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-pastel-purple-light to-pastel-blue-light px-6 pt-6 pb-4 flex flex-col items-center">
              <Avatar className="h-16 w-16 border-3 border-white shadow-lg">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                ) : null}
                <AvatarFallback className="text-xl">{user.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <h3 className="mt-2 text-lg font-bold text-foreground">{user.displayName}</h3>
              {user.tag && <span className="text-xs text-muted-foreground">{user.tag}</span>}
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs px-2.5 py-0.5 bg-purple-100 text-purple-700 border-none">
                  ELO: {user.elo || 1000}
                </Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <StatItem icon={Gamepad2} label="Partidas" value={user.gamesPlayed || 0} color="text-pastel-blue" />
                <StatItem icon={Trophy} label="% Victoria" value={`${user.gamesPlayed > 0 ? Math.round(((user.gamesWon || 0) / user.gamesPlayed) * 100) : 0}%`} color="text-pastel-orange" />
                <StatItem icon={Puzzle} label="Piezas" value={user.piecesExtracted || 0} color="text-pastel-green" />
                <StatItem icon={Star} label="Puntos" value={user.totalPoints || 0} color="text-yellow-500" />
              </div>

              {/* W/L/D */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-green-100 p-2">
                  <TrendingUp className="h-3.5 w-3.5 mx-auto text-green-600 mb-0.5" />
                  <div className="text-sm font-black text-green-700">{user.gamesWon || 0}</div>
                  <div className="text-[9px] text-green-600 font-medium">Victorias</div>
                </div>
                <div className="rounded-lg bg-red-100 p-2">
                  <XCircle className="h-3.5 w-3.5 mx-auto text-red-500 mb-0.5" />
                  <div className="text-sm font-black text-red-600">{user.gamesLost || 0}</div>
                  <div className="text-[9px] text-red-500 font-medium">Derrotas</div>
                </div>
                <div className="rounded-lg bg-amber-100 p-2">
                  <Minus className="h-3.5 w-3.5 mx-auto text-amber-600 mb-0.5" />
                  <div className="text-sm font-black text-amber-700">{user.gamesDrawn || 0}</div>
                  <div className="text-[9px] text-amber-600 font-medium">Empates</div>
                </div>
              </div>

              {/* Shapes drawn */}
              <div className="flex items-center justify-between rounded-xl bg-muted/30 p-2.5">
                <div className="flex items-center gap-2">
                  <Pencil className="h-3.5 w-3.5 text-pastel-purple" />
                  <span className="text-xs font-medium text-muted-foreground">Formas Dibujadas</span>
                </div>
                <span className="text-sm font-bold text-foreground">{user.shapesDrawn || 0}</span>
              </div>

              {/* Friend request button */}
              {showFriendButton && !isMe && (
                <Button 
                  onClick={handleSendRequest} 
                  disabled={requestSent}
                  className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-md gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {requestSent ? 'Solicitud enviada ✓' : 'Enviar solicitud de amistad'}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
