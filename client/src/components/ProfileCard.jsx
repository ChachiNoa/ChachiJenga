import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Trophy, Puzzle, Pencil, Star, TrendingUp, XCircle, Minus, Copy, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { loadAuth, saveAuth } from '@/network/authApi'

const EMOJIS = ['😀', '😎', '🤓', '🤠', '🤖', '👾', '👻', '🐶', '🐱', '🦊', '🐼', '🦁', '🐸', '🦄', '🍕', '🌮', '🎸', '🎮', '🚀', '⭐']

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function StatItem({ icon: Icon, label, value, color, subtext }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-3">
      <Icon className={`h-5 w-5 ${color}`} />
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
      {subtext && <span className="text-[10px] text-muted-foreground/70">{subtext}</span>}
    </div>
  )
}

function ProfileCard({ user, onAvatarChange, onNameChange }) {
  const { t } = useTranslation()
  const [showPicker, setShowPicker] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(user?.displayName || '')
  const [copied, setCopied] = useState(false)

  // Sync internal state if prop changes
  useEffect(() => {
    setNameValue(user?.displayName || '')
  }, [user?.displayName])

  const handleCopyId = () => {
    if (user?.tag) {
      navigator.clipboard.writeText(user.tag)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!user) return null

  const handleSelectEmoji = async (emoji) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/profile/${user.id}/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      })
      const data = await res.json()
      console.log('[ProfileCard] Avatar update response:', data)
      if (data.success) {
        // Persist to localStorage
        const currentAuth = loadAuth()
        if (currentAuth) {
          saveAuth(currentAuth.token, { ...currentAuth.user, avatarUrl: emoji })
        }
        if (onAvatarChange) {
          onAvatarChange(emoji)
        }
      }
    } catch (e) {
      console.error('Failed to update avatar', e)
    } finally {
      setIsUpdating(false)
      setShowPicker(false)
    }
  }

  const handleSaveName = async () => {
    const trimmed = nameValue.trim().slice(0, 20)
    if (!trimmed || trimmed === user.displayName) {
      setEditingName(false)
      return
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/profile/${user.id}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      })
      const data = await res.json()
      console.log('[ProfileCard] Name update response:', data)
      if (data.success) {
        const currentAuth = loadAuth()
        if (currentAuth) {
          saveAuth(currentAuth.token, { ...currentAuth.user, displayName: data.displayName })
        }
        if (onNameChange) onNameChange(data.displayName)
      }
    } catch (e) {
      console.error('Failed to update name', e)
    } finally {
      setEditingName(false)
    }
  }

  const gamesPlayed = user.gamesPlayed || 0
  const gamesWon = user.gamesWon || 0
  const gamesLost = user.gamesLost || 0
  const gamesDrawn = user.gamesDrawn || 0
  const winRate = gamesPlayed > 0
    ? Math.round((gamesWon / gamesPlayed) * 100)
    : 0
  const totalPoints = user.totalPoints || 0
  const piecesExtracted = user.piecesExtracted || 0
  const shapesDrawn = user.shapesDrawn || 0

  return (
    <div className="w-full">
      <h2 className="mb-4 text-xl font-bold text-foreground">{t('profile.title')}</h2>
      <Card>
        <CardHeader className="items-center pb-2">
          <div className="relative group cursor-pointer" onClick={() => setShowPicker(true)}>
            <Avatar className="h-16 w-16 transition-all group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary/50">
              {user.avatarUrl && user.avatarUrl.length <= 4 ? (
                <AvatarFallback className="text-4xl bg-primary/10">{user.avatarUrl}</AvatarFallback>
              ) : user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
              ) : (
                <AvatarFallback className="text-xl">{getInitials(user.displayName || '?')}</AvatarFallback>
              )}
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Pencil className="h-5 w-5 text-white drop-shadow-md" />
            </div>
          </div>
          {editingName ? (
            <div className="mt-2 flex items-center gap-1">
              <input
                type="text"
                value={nameValue}
                onChange={e => setNameValue(e.target.value.slice(0, 20))}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                onBlur={handleSaveName}
                autoFocus
                className="text-lg font-semibold text-center border-b-2 border-primary bg-transparent outline-none w-32"
                maxLength={20}
              />
              <span className="text-[10px] text-muted-foreground">{nameValue.length}/20</span>
            </div>
          ) : (
            <CardTitle 
              className="mt-2 text-lg cursor-pointer hover:text-primary transition-colors group flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-md"
              onClick={() => { setNameValue(user.displayName || ''); setEditingName(true) }}
            >
              {user.displayName}
              <Pencil className="h-4 w-4 text-primary" />
            </CardTitle>
          )}
          {user.tag && (
            <div className="flex items-center gap-1 mt-1 justify-center">
              <span className="bg-yellow-400 text-black font-bold px-2 py-0.5 rounded text-sm">
                {user.tag}
              </span>
              <button onClick={handleCopyId} className="p-1 hover:bg-muted rounded transition-colors" title="Copiar ID">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-foreground" />}
              </button>
            </div>
          )}
          <div className="flex justify-center mt-2">
            <Badge variant="secondary" className="text-sm px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">
              ELO: {user.elo || 1000}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatItem
              icon={Gamepad2}
              label={t('profile.gamesPlayed', 'Partidas')}
              value={gamesPlayed}
              color="text-pastel-blue"
            />
            <StatItem
              icon={Trophy}
              label={t('profile.winRate', '% Victoria')}
              value={`${winRate}%`}
              color="text-pastel-orange"
            />
            <StatItem
              icon={Puzzle}
              label={t('profile.totalPieces', 'Piezas Extraídas')}
              value={piecesExtracted}
              color="text-pastel-green"
            />
            <StatItem
              icon={Star}
              label={t('profile.totalPoints', 'Puntos Totales')}
              value={totalPoints}
              color="text-yellow-500"
            />
          </div>

          {/* W/L/D breakdown */}
          <div className="rounded-xl bg-muted/30 p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              {t('profile.matchBreakdown', 'Desglose de Partidas')}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-green-100 p-2">
                <TrendingUp className="h-4 w-4 mx-auto text-green-600 mb-1" />
                <div className="text-lg font-black text-green-700">{gamesWon}</div>
                <div className="text-[10px] text-green-600 font-medium">{t('profile.wins', 'Victorias')}</div>
              </div>
              <div className="rounded-lg bg-red-100 p-2">
                <XCircle className="h-4 w-4 mx-auto text-red-500 mb-1" />
                <div className="text-lg font-black text-red-600">{gamesLost}</div>
                <div className="text-[10px] text-red-500 font-medium">{t('profile.losses', 'Derrotas')}</div>
              </div>
              <div className="rounded-lg bg-amber-100 p-2">
                <Minus className="h-4 w-4 mx-auto text-amber-600 mb-1" />
                <div className="text-lg font-black text-amber-700">{gamesDrawn}</div>
                <div className="text-[10px] text-amber-600 font-medium">{t('profile.draws', 'Empates')}</div>
              </div>
            </div>
          </div>

          {/* Shapes drawn */}
          <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-pastel-purple" />
              <span className="text-sm font-medium text-muted-foreground">{t('profile.shapesDrawn', 'Formas Dibujadas')}</span>
            </div>
            <span className="text-lg font-bold text-foreground">{shapesDrawn}</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">{t('profile.chooseAvatar', 'Elige un icono')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-3 p-4">
            {EMOJIS.map(emoji => (
              <Button
                key={emoji}
                variant="outline"
                className="h-12 w-12 text-2xl"
                disabled={isUpdating}
                onClick={() => handleSelectEmoji(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfileCard
