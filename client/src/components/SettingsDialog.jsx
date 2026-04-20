import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Volume2, Vibrate, LogOut } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { audio } from '@/lib/audio'

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]

function SettingsDialog({ open, onOpenChange, onLogout }) {
  const { t, i18n } = useTranslation()
  const [volume, setVolume] = useState(Math.round(audio.volume * 100))
  const [soundEnabled, setSoundEnabled] = useState(audio.enabled)

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  const handleLanguageToggle = () => {
    const nextIndex = (LANGUAGES.findIndex((l) => l.code === i18n.language) + 1) % LANGUAGES.length
    i18n.changeLanguage(LANGUAGES[nextIndex].code)
  }

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value)
    setVolume(val)
    audio.setVolume(val / 100)
    if (val > 0 && !soundEnabled) {
      setSoundEnabled(true)
      audio.setEnabled(true)
    }
  }

  const handleSoundToggle = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    audio.setEnabled(next)
    if (next) audio.play('select')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Volume */}
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{t('settings.volume')}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 accent-primary"
            />
          </div>

          {/* Sound On/Off */}
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <Vibrate className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{t('settings.vibration', 'Sonido y Vibración')}</span>
            </div>
            <button
              onClick={handleSoundToggle}
              className={`h-6 w-11 rounded-full transition-colors ${soundEnabled ? 'bg-primary' : 'bg-muted'}`}
              aria-label={t('settings.vibration')}
            >
              <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${soundEnabled ? 'ml-5' : 'ml-0.5'}`} />
            </button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{t('settings.language')}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLanguageToggle}>
              {currentLang.label}
            </Button>
          </div>

          {/* Logout */}
          <Button
            variant="destructive"
            className="mt-2 w-full"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            {t('settings.logout')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsDialog

