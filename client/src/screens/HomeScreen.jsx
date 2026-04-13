import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Trophy, User, Settings, Gamepad2 } from 'lucide-react'

function HomeScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleFindMatch = () => {
    // TODO: Implement matchmaking via Socket.io
  }

  return (
    <div className="flex min-h-svh flex-col items-center bg-gradient-to-b from-pastel-blue-light to-pastel-green-light px-6 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          🏗️ {t('login.title')}
        </h1>
      </div>

      {/* Find Match - Main CTA */}
      <button
        onClick={handleFindMatch}
        className="mb-8 flex w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-5 text-xl font-bold text-primary-foreground shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-md"
      >
        <Gamepad2 className="h-7 w-7" />
        {t('home.findMatch')}
      </button>

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
          <span className="font-medium text-muted-foreground">ELO: <strong className="text-foreground">1000</strong></span>
          <span className="text-muted-foreground">{t('home.wins')}: <strong className="text-success">0</strong></span>
          <span className="text-muted-foreground">{t('home.losses')}: <strong className="text-error">0</strong></span>
        </div>
      </div>

      {/* Settings button */}
      <button
        className="flex items-center gap-2 rounded-full bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:bg-card/80 hover:text-foreground"
      >
        <Settings className="h-4 w-4" />
        {t('home.settings')}
      </button>
    </div>
  )
}

export default HomeScreen
