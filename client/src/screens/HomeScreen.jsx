import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Trophy, User, Settings, Gamepad2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadAuth, clearAuth } from '@/network/authApi'
import SettingsDialog from '@/components/SettingsDialog'
import { useEffect } from 'react'

function HomeScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searching, setSearching] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const auth = loadAuth()
    if (!auth?.token) {
      navigate('/login', { replace: true })
      return
    }
    setUser(auth.user)
  }, [navigate])

  const handleFindMatch = () => {
    setSearching(true)
    // TODO: Connect to Socket.io matchmaking
  }

  const handleCancelSearch = () => {
    setSearching(false)
    // TODO: Cancel Socket.io matchmaking
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <div className="flex min-h-svh flex-col items-center bg-gradient-to-b from-pastel-blue-light to-pastel-green-light px-6 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          🏗️ {t('login.title')}
        </h1>
        {user.displayName && (
          <p className="mt-1 text-sm text-muted-foreground">
            {user.displayName}
          </p>
        )}
      </div>

      {/* Find Match - Main CTA */}
      {!searching ? (
        <Button
          size="xl"
          onClick={handleFindMatch}
          className="mb-8 w-full max-w-xs gap-3"
        >
          <Gamepad2 className="h-7 w-7" />
          {t('home.findMatch')}
        </Button>
      ) : (
        <div className="mb-8 flex w-full max-w-xs flex-col items-center gap-3">
          <div className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary/20 px-8 py-5">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg font-semibold text-primary">{t('home.searching')}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancelSearch}>
            <X className="h-4 w-4" />
            {t('home.cancel')}
          </Button>
        </div>
      )}

      {/* Ranking & Profile cards */}
      <div className="mb-8 grid w-full max-w-xs grid-cols-2 gap-4">
        <button
          className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Trophy className="h-8 w-8 text-pastel-orange" />
          <span className="font-semibold text-card-foreground">{t('home.ranking')}</span>
        </button>
        <button
          className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <User className="h-8 w-8 text-pastel-blue" />
          <span className="font-semibold text-card-foreground">{t('home.profile')}</span>
        </button>
      </div>

      {/* Quick stats */}
      <div className="mb-8 w-full max-w-xs rounded-2xl bg-card/80 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">ELO: <strong className="text-foreground">{user.elo || 1000}</strong></span>
          <span className="text-muted-foreground">{t('home.wins')}: <strong className="text-success">{user.gamesWon || 0}</strong></span>
          <span className="text-muted-foreground">{t('home.losses')}: <strong className="text-error">{user.gamesLost || 0}</strong></span>
        </div>
      </div>

      {/* Settings button */}
      <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
        <Settings className="h-4 w-4" />
        {t('home.settings')}
      </Button>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onLogout={handleLogout}
      />
    </div>
  )
}

export default HomeScreen
