import { useTranslation } from 'react-i18next'
import { Globe, Volume2, Vibrate, LogOut } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]

function SettingsDialog({ open, onOpenChange, onLogout }) {
  const { t, i18n } = useTranslation()

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  const handleLanguageToggle = () => {
    const nextIndex = (LANGUAGES.findIndex((l) => l.code === i18n.language) + 1) % LANGUAGES.length
    i18n.changeLanguage(LANGUAGES[nextIndex].code)
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
              defaultValue="80"
              className="w-24 accent-primary"
            />
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <Vibrate className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{t('settings.vibration')}</span>
            </div>
            <button
              className="h-6 w-11 rounded-full bg-primary transition-colors"
              aria-label={t('settings.vibration')}
            >
              <div className="ml-5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform" />
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
