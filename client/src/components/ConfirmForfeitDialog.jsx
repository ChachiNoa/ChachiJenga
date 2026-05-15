import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function ConfirmForfeitDialog({ open, onOpenChange, onConfirm }) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs p-6 text-center">
        <DialogHeader>
          <DialogTitle className="text-xl text-center text-red-600 mb-2 font-black">
            {t('game.forfeitTitle', '¿Rendirse?')}
          </DialogTitle>
          <DialogDescription className="text-center text-base mb-4 font-medium text-muted-foreground">
            {t('game.confirmForfeit', '¿Estás seguro de que quieres rendirte? Perderás la partida y puntos de ELO.')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2 mt-2">
          <Button 
            variant="destructive" 
            className="w-full text-lg font-bold h-12 shadow-md"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {t('game.yesForfeit', 'Sí, rendirme')}
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-lg font-bold h-12 border-2 text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            {t('game.cancel', 'Cancelar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
