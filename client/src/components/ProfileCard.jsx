import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Trophy, Puzzle, Pencil } from 'lucide-react'

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function StatItem({ icon: Icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-3">
      <Icon className={`h-5 w-5 ${color}`} />
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function ProfileCard({ user }) {
  const { t } = useTranslation()

  if (!user) return null

  const winRate = user.gamesPlayed > 0
    ? Math.round(((user.gamesWon || 0) / user.gamesPlayed) * 100)
    : 0

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
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <StatItem
              icon={Gamepad2}
              label={t('profile.gamesPlayed')}
              value={user.gamesPlayed || 0}
              color="text-pastel-blue"
            />
            <StatItem
              icon={Trophy}
              label={t('profile.winRate')}
              value={`${winRate}%`}
              color="text-pastel-orange"
            />
            <StatItem
              icon={Puzzle}
              label={t('profile.totalPieces')}
              value={user.piecesExtracted || 0}
              color="text-pastel-green"
            />
            <StatItem
              icon={Pencil}
              label={t('profile.shapesDrawn')}
              value={user.shapesDrawn || 0}
              color="text-pastel-purple"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfileCard
