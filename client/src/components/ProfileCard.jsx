import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Trophy, Puzzle, Pencil, Star, TrendingUp, XCircle, Minus } from 'lucide-react'

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

function ProfileCard({ user }) {
  const { t } = useTranslation()

  if (!user) return null

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
          <Avatar className="h-16 w-16">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            ) : (
              <AvatarFallback className="text-xl">{getInitials(user.displayName || '?')}</AvatarFallback>
            )}
          </Avatar>
          <CardTitle className="mt-2 text-lg">{user.displayName}</CardTitle>
          <Badge variant="secondary" className="mt-1">
            ELO: {user.elo || 1000}
          </Badge>
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
    </div>
  )
}

export default ProfileCard
