import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Trophy, User, Settings, Gamepad2, Loader2, X, Shield, Users, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { loadAuth, clearAuth, saveAuth } from '@/network/authApi'
import SettingsDialog from '@/components/SettingsDialog'
import RankingList from '@/components/RankingList'
import ProfileCard from '@/components/ProfileCard'
import FriendsDialog from '@/components/FriendsDialog'
import GuildDialog from '@/components/GuildDialog'
import { ChallengeReceivedDialog, ChallengeSentIndicator } from '@/components/ChallengeDialog'
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
  const [incomingChallenge, setIncomingChallenge] = useState(null)
  const [challengeSent, setChallengeSent] = useState(null) // { challengeId, targetName }
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertContent, setAlertContent] = useState({ title: '', message: '' })
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

    // Challenge events
    const onChallengeReceived = (data) => {
      audio.play('match_found')
      audio.vibrate([100, 50, 100])
      setIncomingChallenge(data)
    }
    const onChallengeSent = ({ challengeId }) => {
      setChallengeSent(prev => prev ? { ...prev, challengeId } : prev)
    }
    const onChallengeExpired = () => {
      setIncomingChallenge(null)
      setChallengeSent(null)
    }
    const onChallengeRejected = () => {
      setChallengeSent(null)
    }
    const onChallengeError = (msg) => {
      setChallengeSent(null)
      setAlertContent({ 
        title: t('common.oops', '¡Ups!'), 
        message: msg 
      })
      setAlertOpen(true)
      console.error('[Challenge]', msg)
    }

    socket.on('challenge_received', onChallengeReceived)
    socket.on('challenge_sent', onChallengeSent)
    socket.on('challenge_expired', onChallengeExpired)
    socket.on('challenge_rejected', onChallengeRejected)
    socket.on('challenge_error', onChallengeError)

    return () => {
      socket.off('game_started', onGameStarted)
      socket.off('challenge_received', onChallengeReceived)
      socket.off('challenge_sent', onChallengeSent)
      socket.off('challenge_expired', onChallengeExpired)
      socket.off('challenge_rejected', onChallengeRejected)
      socket.off('challenge_error', onChallengeError)
    }
  }, [socket, navigate])

  const handleSendChallenge = (targetUserId, targetName) => {
    if (!socket || !user) return
    setChallengeSent({ targetName, challengeId: null })
    socket.emit('send_challenge', {
      targetUserId,
      user: {
        id: user.id,
        name: user.displayName,
        displayName: user.displayName,
        avatarUrl: fullProfile?.user?.avatarUrl || user.avatarUrl,
        tag: fullProfile?.user?.tag || user.tag,
        elo: user.elo || 1000
      }
    })
  }

  const handleAcceptChallenge = () => {
    if (!socket || !incomingChallenge) return
    socket.emit('accept_challenge', {
      challengeId: incomingChallenge.challengeId,
      user: {
        id: user.id,
        name: user.displayName,
        avatarUrl: fullProfile?.user?.avatarUrl || user.avatarUrl,
        tag: fullProfile?.user?.tag || user.tag,
        elo: user.elo || 1000
      }
    })
    setIncomingChallenge(null)
  }

  const handleRejectChallenge = () => {
    if (!socket || !incomingChallenge) return
    socket.emit('reject_challenge', { challengeId: incomingChallenge.challengeId })
    setIncomingChallenge(null)
  }

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
      <FriendsDialog open={friendsOpen} onOpenChange={setFriendsOpen} auth={{ token: authToken, user }} onChallenge={handleSendChallenge} />

      {/* Guild Dialog */}
      <GuildDialog open={guildOpen} onOpenChange={setGuildOpen} auth={{ token: authToken, user }} />

      {/* Challenge received */}
      <ChallengeReceivedDialog 
        challenge={incomingChallenge} 
        onAccept={handleAcceptChallenge} 
        onReject={handleRejectChallenge} 
      />

      {/* Challenge sent indicator */}
      {challengeSent && (
        <ChallengeSentIndicator 
          targetName={challengeSent.targetName} 
          onCancel={() => setChallengeSent(null)} 
        />
      )}

      {/* Beautiful Alert Dialog */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="sm:max-w-xs p-6 flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 animate-bounce">
             <AlertCircle className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{alertContent.title}</h3>
            <p className="text-muted-foreground text-sm mt-2">{alertContent.message}</p>
          </div>
          <Button onClick={() => setAlertOpen(false)} className="w-full bg-pastel-blue hover:bg-pastel-blue/80 text-white font-bold h-12 rounded-xl shadow-md">
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HomeScreen
