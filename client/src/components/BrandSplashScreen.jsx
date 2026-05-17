import React, { useEffect, useState } from 'react'

export default function BrandSplashScreen({ onComplete }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    // Only start the countdown when the image is fully downloaded and ready
    if (!imgLoaded && !imgError) return

    // Total animation duration is 3.8s
    const timer = setTimeout(() => {
      if (onComplete) onComplete()
    }, 3800)

    return () => clearTimeout(timer)
  }, [imgLoaded, imgError, onComplete])

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black overflow-hidden select-none touch-none">
      {/* Dynamic styles so animation only starts when loaded */}
      <style>{`
        .splash-gradient-bg {
          background-color: #0b5294;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
        }
        
        .splash-gradient-bg.animate-splash {
          animation: fadeTransition 3.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .splash-image {
          width: 100%;
          height: 100svh;
          object-fit: cover;
        }
        
        .splash-image.animate-splash {
          animation: logoScale 3.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes fadeTransition {
          0% { opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes logoScale {
          0% { transform: scale(1.05); }
          15% { transform: scale(1); }
          85% { transform: scale(1); }
          100% { transform: scale(0.95); opacity: 0; }
        }
      `}</style>

      {/* Main splash with radial blue gradient and black fade effect */}
      <div className={\`splash-gradient-bg \${imgLoaded || imgError ? 'animate-splash' : ''}\`}>
        <img
          src="/assets/chachigames_splash.jpg"
          alt="ChachiGames Splash"
          className={\`splash-image \${imgLoaded || imgError ? 'animate-splash' : ''}\`}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgError(true)
            setImgLoaded(true) // start timer even if error so we don't freeze
          }}
        />
      </div>
    </div>
  )
}
