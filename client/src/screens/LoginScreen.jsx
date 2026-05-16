import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage, getSuccessMessage } from '../lib/errorTranslations'
import { Globe } from 'lucide-react'
import { useEffect, useCallback, useState } from 'react'
import { loginWithGoogle, devLogin, saveAuth, loadAuth } from '@/network/authApi'
import { auth as firebaseAuth, googleProvider } from '../lib/firebase'
import { signInWithPopup } from 'firebase/auth'

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function LoginScreen() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]
  // In production, we use Firebase. In local without config, we use Dev Mode.
  const isDevMode = !import.meta.env.VITE_FIREBASE_API_KEY && !GOOGLE_CLIENT_ID

  // Redirect if already authenticated
  useEffect(() => {
    const auth = loadAuth()
    if (auth?.token) {
      navigate('/home', { replace: true })
    }
  }, [navigate])

  // Initialize Google Sign-In
  const [toast, setToast] = useState({ message: '', type: 'error' })

  const showToast = (msg, type = 'error') => {
    try {
      const finalMsg = type === 'error' ? getErrorMessage(msg) : getSuccessMessage(msg)
      setToast({ message: finalMsg, type })
      setTimeout(() => setToast({ message: '', type: 'error' }), 3000)
    } catch (e) {
      console.error('Toast error:', e)
      setToast({ message: String(msg), type })
      setTimeout(() => setToast({ message: '', type: 'error' }), 3000)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider)
      const idToken = await result.user.getIdToken()
      
      const { token, user } = await loginWithGoogle(idToken)
      saveAuth(token, user)
      navigate('/home', { replace: true })
    } catch (error) {
      console.error('Firebase Login Error:', error)
      showToast(error.message || 'Error en inicio de sesión')
    }
  }

  const [devName, setDevName] = useState('Dev Player')
  const [devLoading, setDevLoading] = useState(false)
  const [showDevOptions, setShowDevOptions] = useState(false)

  const handleDevLogin = async () => {
    setDevLoading(true)
    try {
      const { token, user } = await devLogin(devName)
      saveAuth(token, user)
      navigate('/home', { replace: true })
    } catch (err) {
      showToast(err.message || 'Failed to connect to server')
    } finally {
      setDevLoading(false)
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

      {/* Login options */}
      <div className="w-full max-w-xs flex flex-col gap-6">
        {/* Google login button (Always visible) */}
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-gray-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md border-2 border-transparent hover:border-pastel-purple/30"
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

      </div>

      {/* Decorative bottom */}
      <div className="mt-16 flex gap-2">
        <div className="h-2 w-8 rounded-full bg-pastel-pink opacity-60" />
        <div className="h-2 w-8 rounded-full bg-pastel-blue opacity-60" />
        <div className="h-2 w-8 rounded-full bg-pastel-green opacity-60" />
        <div className="h-2 w-8 rounded-full bg-pastel-yellow opacity-60" />
        <div className="h-2 w-8 rounded-full bg-pastel-purple opacity-60" />
      </div>
      <p className="mt-4 text-xs text-foreground/25 font-medium tracking-wide">by ChachiGames</p>

      {/* Toast feedback */}
      {toast.message && (
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-sm font-bold shadow-xl border-4 border-white/40 animate-in fade-in slide-in-from-bottom-4 z-[100] flex items-center gap-3 ${toast.type === 'error' ? 'bg-error text-red-900 border-red-200' : 'bg-success text-green-900 border-green-200'}`}>
          <span className="text-xl">{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}

export default LoginScreen
