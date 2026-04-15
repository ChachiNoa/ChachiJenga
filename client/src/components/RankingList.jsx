import { useTranslation } from 'react-i18next'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

// TODO: Replace with real data from API
const MOCK_RANKING = [
  { id: 1, display_name: 'ProJenga', avatar_url: null, elo: 1450, games_played: 87, games_won: 52, pieces_extracted: 312 },
  { id: 2, display_name: 'TowerMaster', avatar_url: null, elo: 1380, games_played: 65, games_won: 40, pieces_extracted: 245 },
  { id: 3, display_name: 'DrawKing', avatar_url: null, elo: 1320, games_played: 43, games_won: 28, pieces_extracted: 178 },
  { id: 4, display_name: 'SketchPro', avatar_url: null, elo: 1250, games_played: 31, games_won: 18, pieces_extracted: 120 },
  { id: 5, display_name: 'BlockBuster', avatar_url: null, elo: 1180, games_played: 22, games_won: 12, pieces_extracted: 85 },
]

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getMedalEmoji(position) {
  if (position === 1) return '🥇'
  if (position === 2) return '🥈'
  if (position === 3) return '🥉'
  return `${position}`
}

function RankingList() {
  const { t } = useTranslation()

  return (
    <div className="w-full">
      <h2 className="mb-4 text-xl font-bold text-foreground">{t('ranking.title')}</h2>
      <div className="rounded-2xl border border-border bg-card shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">{t('ranking.position')}</TableHead>
              <TableHead>{t('ranking.player')}</TableHead>
              <TableHead className="text-right">{t('ranking.elo')}</TableHead>
              <TableHead className="text-right">{t('ranking.pieces')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_RANKING.map((player, index) => (
              <TableRow key={player.id}>
                <TableCell className="text-center font-bold">
                  {getMedalEmoji(index + 1)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      {player.avatar_url ? (
                        <AvatarImage src={player.avatar_url} alt={player.display_name} />
                      ) : (
                        <AvatarFallback className="text-xs">{getInitials(player.display_name)}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-sm font-medium">{player.display_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{player.elo}</Badge>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {player.pieces_extracted}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default RankingList
