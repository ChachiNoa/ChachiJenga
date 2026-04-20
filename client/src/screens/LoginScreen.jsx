import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Globe } from 'lucide-react'
import { useEffect, useCallback } from 'react'
import { loginWithGoogle, saveAuth, loadAuth } from '@/network/authApi'

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function LoginScreen() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  // Redirect if already authenticated
  useEffect(() => {
    const auth = loadAuth()
    if (auth?.token) {
      navigate('/home', { replace: true })
    }
  }, [navigate])

  // Initialize Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      })
    }

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const handleGoogleResponse = useCallback(async (response) => {
    try {
      const { token, user } = await loginWithGoogle(response.credential)
      saveAuth(token, user)
      navigate('/home', { replace: true })
    } catch (error) {
      // TODO: Show error toast to user
    }
  }, [navigate])

  const handleGoogleLogin = () => {
    if (GOOGLE_CLIENT_ID && window.google) {
      window.google.accounts.id.prompt()
    } else {
      // DEV mode: simulate login when no Google client ID is configured
      const mockUser = {
        id: 1,
        displayName: 'Dev Player',
        email: 'dev@chachijenga.local',
        avatarUrl: null,
        elo: 1000,
        gamesPlayed: 0,
      }
      saveAuth('dev-token', mockUser)
      navigate('/home', { replace: true })
    }
  }

  const handleLanguageToggle = () => {
    const nextIndex = (LANGUAGES.findIndex((l) => l.code === i18n.language) + 1) % LANGUAGES.length
    i18n.changeLanguage(LANGUAGES[nextIndex].code)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-pastel-purple-light to-pastel-pink-light px-6 animate-page-enter">
      {/* Language selector */}
      <button
        onClick={handleLanguageToggle}
        className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md"
        aria-label={t('login.language')}
      >
        <Globe className="h-4 w-4" />
        <span>{currentLang.label}</span>
      </button>

      {/* Logo & title */}
      <div className="mb-12 text-center">
        <div className="mb-4 text-7xl">🏗️</div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
          {t('login.title')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('login.subtitle')}
        </p>
      </div>

      {/* Google login button */}
      <button
        onClick={handleGoogleLogin}
        className="flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-gray-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {t('login.signInWithGoogle')}
      </button>

      {/* Dev mode indicator */}
      {!GOOGLE_CLIENT_ID && (
        <p className="mt-4 text-xs text-muted-foreground/60">
          Dev mode — click to skip login
        </p>
      )}

      {/* Decorative bottom */}
      <div className="mt-16 flex gap-2">
        <div className="h-2 w-8 rounded-full bg-pastel-pink opacity-60" />
        <div className="h-2 w-8 rounded-full bg-pastel-blue opacity-60" />
        <div className="h-2 w-8 rounded-full bg-pastel-green opacity-60" />
        <div className="h-2 w-8 rounded-full bg-pastel-yellow opacity-60" />
        <div className="h-2 w-8 rounded-full bg-pastel-purple opacity-60" />
      </div>
    </div>
  )
}

export default LoginScreen
