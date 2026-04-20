/**
 * AudioManager — Singleton for all game SFX.
 * Uses Web Audio API with lazy-loading of sound effects.
 * Sounds are generated procedurally (no external files needed).
 */

class AudioManager {
  constructor() {
    this.ctx = null
    this.enabled = true
    this.volume = 0.5
  }

  _ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
  }

  /**
   * Play a procedurally generated sound effect.
   * @param {'select'|'correct'|'error'|'tick'|'collapse'|'victory'|'defeat'|'match_found'|'turn'} name
   */
  play(name) {
    if (!this.enabled) return
    this._ensureContext()

    const now = this.ctx.currentTime
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(this.volume, now)
    gain.connect(this.ctx.destination)

    switch (name) {
      case 'select': {
        // Short click/pop
        const osc = this.ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(800, now)
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
        osc.connect(gain)
        osc.start(now)
        osc.stop(now + 0.1)
        break
      }
      case 'correct': {
        // Ascending happy ding
        const osc = this.ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523, now)     // C5
        osc.frequency.setValueAtTime(659, now + 0.1) // E5
        osc.frequency.setValueAtTime(784, now + 0.2) // G5
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
        osc.connect(gain)
        osc.start(now)
        osc.stop(now + 0.4)
        break
      }
      case 'error': {
        // Low buzz
        const osc = this.ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(150, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
        osc.connect(gain)
        osc.start(now)
        osc.stop(now + 0.25)
        break
      }
      case 'tick': {
        // Timer tick
        const osc = this.ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1000, now)
        gain.gain.setValueAtTime(this.volume * 0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
        osc.connect(gain)
        osc.start(now)
        osc.stop(now + 0.05)
        break
      }
      case 'collapse': {
        // Rumble with noise
        const bufferSize = this.ctx.sampleRate * 0.8
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
        }
        const noise = this.ctx.createBufferSource()
        noise.buffer = buffer
        const filter = this.ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(400, now)
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.8)
        noise.connect(filter)
        filter.connect(gain)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
        noise.start(now)
        noise.stop(now + 0.8)
        break
      }
      case 'victory': {
        // Fanfare
        const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
        notes.forEach((freq, i) => {
          const osc = this.ctx.createOscillator()
          const g = this.ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, now + i * 0.15)
          g.gain.setValueAtTime(this.volume, now + i * 0.15)
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3)
          osc.connect(g)
          g.connect(this.ctx.destination)
          osc.start(now + i * 0.15)
          osc.stop(now + i * 0.15 + 0.3)
        })
        break
      }
      case 'defeat': {
        // Descending sad
        const osc = this.ctx.createOscillator()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.6)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7)
        osc.connect(gain)
        osc.start(now)
        osc.stop(now + 0.7)
        break
      }
      case 'match_found': {
        // Two quick ascending pings
        ;[880, 1100].forEach((freq, i) => {
          const osc = this.ctx.createOscillator()
          const g = this.ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, now + i * 0.12)
          g.gain.setValueAtTime(this.volume, now + i * 0.12)
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.15)
          osc.connect(g)
          g.connect(this.ctx.destination)
          osc.start(now + i * 0.12)
          osc.stop(now + i * 0.12 + 0.15)
        })
        break
      }
      case 'turn': {
        // Simple bell
        const osc = this.ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(660, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
        osc.connect(gain)
        osc.start(now)
        osc.stop(now + 0.2)
        break
      }
    }
  }

  // Trigger haptic feedback if available
  vibrate(pattern = [50]) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }
}

// Singleton
export const audio = new AudioManager()
