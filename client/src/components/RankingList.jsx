import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

function getInitials(name) {
  if (!name) return '?'
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
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/ranking`)
      .then(r => r.json())
      .then(data => {
        if (data.ranking) setRanking(data.ranking)
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="text-center p-4">Loading...</div>

  return (
    <div className="w-full">
      <h2 className="mb-4 text-xl font-bold text-foreground">{t('ranking.title', 'Ranking Mundial')}</h2>
      <div className="rounded-2xl border border-border bg-card shadow-md overflow-hidden max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">{t('ranking.position', 'Pos')}</TableHead>
              <TableHead>{t('ranking.player', 'Jugador')}</TableHead>
              <TableHead className="text-right">{t('ranking.elo', 'ELO')}</TableHead>
              <TableHead className="text-right">{t('ranking.pieces', 'Piezas')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.map((player) => (
              <TableRow key={player.id}>
                <TableCell className="text-center font-bold">
                  {getMedalEmoji(player.rank)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      {player.avatarUrl ? (
                        <AvatarImage src={player.avatarUrl} alt={player.displayName} />
                      ) : (
                        <AvatarFallback className="text-xs">{getInitials(player.displayName)}</AvatarFallback>
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
