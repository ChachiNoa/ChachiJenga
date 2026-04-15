import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export default function SummaryScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 bg-gradient-to-br from-pastel-purple/30 to-pastel-blue/30">
      <div className="text-center bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
        <h1 className="text-3xl font-black mb-4">{t('summary.victory') || 'Game Over!'}</h1>
        <p className="mb-8 text-muted-foreground">The minigame flow is complete.</p>
        
        <Button onClick={() => navigate('/home')} className="w-full">
          {t('summary.goHome') || 'Go Home'}
        </Button>
      </div>
    </div>
  )
}
