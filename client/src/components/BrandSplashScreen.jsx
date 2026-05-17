import React, { useEffect, useState } from 'react'

export default function BrandSplashScreen({ onComplete }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [phase, setPhase] = useState('waiting') // waiting -> visible -> fading -> done

  useEffect(() => {
    if (!imgLoaded) return

    // Image loaded — show it immediately
    setPhase('visible')

    // After 4 seconds visible, start fading out
    const fadeTimer = setTimeout(() => {
      setPhase('fading')
    }, 4000)

    // After 4.5s total, complete (500ms for fade out)
    const doneTimer = setTimeout(() => {
      if (onComplete) onComplete()
    }, 4500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [imgLoaded, onComplete])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      backgroundColor: '#1f64a5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      userSelect: 'none',
      touchAction: 'none',
    }}>
      {/* Background layer: uses the exact same JPG to bypass Android Chrome's color profile mismatch.
          By blurring and scaling it, it creates a perfectly matched background gradient. */}
      <div style={{
        position: 'absolute',
        inset: -50,
        backgroundImage: 'url(/assets/chachigames_splash.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(40px)',
        opacity: phase === 'visible' ? 1 : phase === 'fading' ? 0 : 0,
        transition: phase === 'visible'
          ? 'opacity 0.4s ease-in'
          : phase === 'fading'
            ? 'opacity 0.5s ease-out'
            : 'none',
      }} />

      {/* Foreground image layer */}
      <img
        src="/assets/chachigames_splash.jpg"
        alt="ChachiGames"
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgLoaded(true)}
        style={{
          position: 'relative',
          width: '100%',
          height: '100svh',
          objectFit: 'contain',
          zIndex: 10,
          opacity: phase === 'visible' ? 1 : phase === 'fading' ? 0 : 0,
          transition: phase === 'visible'
            ? 'opacity 0.4s ease-in'
            : phase === 'fading'
              ? 'opacity 0.5s ease-out'
              : 'none',
        }}
      />
    </div>
  )
}
