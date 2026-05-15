import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Trophy, User, Settings, Gamepad2, Loader2, X, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { loadAuth, clearAuth, saveAuth } from '@/network/authApi'
import SettingsDialog from '@/components/SettingsDialog'
import RankingList from '@/components/RankingList'
import ProfileCard from '@/components/ProfileCard'
import FriendsDialog from '@/components/FriendsDialog'
import GuildDialog from '@/components/GuildDialog'
import { useSocket } from '@/hooks/useSocket'
import { audio } from '@/lib/audio'

function HomeScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searching, setSearching] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rankingOpen, setRankingOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [guildOpen, setGuildOpen] = useState(false)
  const [friendsOpen, setFriendsOpen] = useState(false)
  const [user, setUser] = useState(() => loadAuth()?.user || null)
  const [authToken, setAuthToken] = useState(() => loadAuth()?.token || null)
  const [fullProfile, setFullProfile] = useState(null)
  const [pendingFriends, setPendingFriends] = useState(0)
  const [pendingGuilds, setPendingGuilds] = useState(0)
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    if (user && !fullProfile) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/profile/${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.user) {
            setFullProfile(data)
            // Update local storage so basic info is fresh immediately on next load
            const currentAuth = loadAuth()
            if (currentAuth) {
              const updatedUser = { ...currentAuth.user, ...data.user }
              saveAuth(currentAuth.token, updatedUser)
              setUser(updatedUser)
            }
          }
        })
        .catch(console.error)
    }
  }, [user, fullProfile])

  useEffect(() => {
    if (!authToken) {
      navigate('/login', { replace: true })
    }
  }, [authToken, navigate])

  // Fetch notification counts
  useEffect(() => {
    if (!authToken) return
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    
    const fetchCounts = async () => {
      try {
        // Friend requests
        const fRes = await fetch(`${API}/api/friends/pending`, { headers: { Authorization: `Bearer ${authToken}` } })
        if (fRes.ok) {
          const fData = await fRes.json()
          setPendingFriends(fData.length)
        }
        // Guild invitations
        const gRes = await fetch(`${API}/api/guilds/invitations/pending`, { headers: { Authorization: `Bearer ${authToken}` } })
        if (gRes.ok) {
          const gData = await gRes.json()
          setPendingGuilds(gData.length)
        }
      } catch (e) { console.error(e) }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [authToken, friendsOpen, guildOpen])

  useEffect(() => {
    if (!socket) return

    const onGameStarted = (data) => {
      setSearching(false)
      audio.play('match_found')
      audio.vibrate([100, 50, 100])
      navigate('/tower', { state: { gameData: data } })
    }

    socket.on('game_started', onGameStarted)

    return () => {
      socket.off('game_started', onGameStarted)
    }
  }, [socket, navigate])

  const handleFindMatch = () => {
    setSearching(true)
    // Clear autoJoin state to prevent re-runs
    if (location.state?.autoJoin) {
      navigate('/home', { replace: true, state: {} })
    }
    if (socket && user) {
      socket.emit('join_queue', {
        id: user.id || 'anonymous',
        name: user.displayName || 'Player',
        avatarUrl: fullProfile?.user?.avatarUrl || user.avatarUrl,
        tag: fullProfile?.user?.tag || user.tag,
        elo: user.elo || 1000
      })
    }
  }

  useEffect(() => {
    if (user && socket && location.state?.autoJoin && !searching) {
      handleFindMatch()
    }
  }, [user, socket, location.state, searching])

  const handleCancelSearch = () => {
    setSearching(false)
    if (socket) {
      socket.emit('leave_queue')
    }
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

      {/* Ranking & Profile & Guild cards */}
      <div className="mb-4 grid w-full max-w-xs grid-cols-3 gap-3">
        <button
          onClick={() => setRankingOpen(true)}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card p-3 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Trophy className="h-6 w-6 text-pastel-orange" />
          <span className="text-xs font-semibold text-card-foreground">{t('home.ranking')}</span>
        </button>
        <button
          onClick={() => setProfileOpen(true)}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card p-3 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <User className="h-6 w-6 text-pastel-blue" />
          <span className="text-xs font-semibold text-card-foreground">{t('home.profile')}</span>
        </button>
        <button
          onClick={() => setGuildOpen(true)}
          className="relative flex flex-col items-center justify-center gap-2 rounded-2xl bg-card p-3 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Shield className="h-6 w-6 text-pastel-green" />
          <span className="text-xs font-semibold text-card-foreground">Gremio</span>
          {pendingGuilds > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card animate-pulse" />}
        </button>
      </div>

      <Button variant="outline" className="relative mb-8 w-full max-w-xs gap-2 rounded-2xl shadow-sm h-12" onClick={() => setFriendsOpen(true)}>
        <Users className="h-5 w-5" />
        Amigos
        {pendingFriends > 0 && <span className="absolute top-2 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
      </Button>

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

      {/* Ranking Dialog */}
      <Dialog open={rankingOpen} onOpenChange={setRankingOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col p-6">
          <RankingList />
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <ProfileCard 
            user={fullProfile?.user || user} 
            onAvatarChange={(emoji) => {
              if (fullProfile) {
                setFullProfile({ ...fullProfile, user: { ...fullProfile.user, avatarUrl: emoji } })
              }
              setUser(prev => ({ ...prev, avatarUrl: emoji }))
            }}
            onNameChange={(newName) => {
              if (fullProfile) {
                setFullProfile({ ...fullProfile, user: { ...fullProfile.user, displayName: newName } })
              }
              setUser(prev => ({ ...prev, displayName: newName }))
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Friends Dialog */}
      <FriendsDialog open={friendsOpen} onOpenChange={setFriendsOpen} auth={{ token: authToken, user }} />

      {/* Guild Dialog */}
      <GuildDialog open={guildOpen} onOpenChange={setGuildOpen} auth={{ token: authToken, user }} />
    </div>
  )
}

export default HomeScreen
