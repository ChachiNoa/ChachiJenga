import React, { useRef, useEffect, useState, useMemo } from 'react'
import { DifficultyManager } from '../game/DifficultyManager'
import { GAME } from '@/shared/constants'

const TOWER_LAYERS = 18;
const PIECES_PER_LAYER = 3;
const PROTECTED_TOP = GAME.PROTECTED_TOP_LAYERS;

// Block rendering constants
const BLOCK_W = 3
const BLOCK_D = 1
const BLOCK_H = 1

// UNIT_WIDTH is now calculated dynamically in drawTower based on canvas size

export default function Tower({ layers, onSelectPiece, interactive = true, opponentHoveredPiece = null }) {
  const canvasRef = useRef(null)
  const [hoveredPiece, setHoveredPiece] = useState(null)

  // Pre-calculate block data to make sorting and rendering fast
  const blocks = useMemo(() => {
    const list = []
    
    // Validate layers input
    if (!layers || layers.length === 0) return list;

    layers.forEach((layer, lIndex) => {
      // Even layer: horizontal. Size: 3 wide, 1 deep.
      // Odd layer: vertical. Size: 1 wide, 3 deep.
      const isHorizontal = layer.orientation === 'horizontal' || lIndex % 2 === 0
      
      layer.pieces.forEach((piece, pIndex) => {
        if (!piece.present) return

        let x, z
        const y = lIndex * BLOCK_H

        if (isHorizontal) {
          x = 0 // spans 0 to 3
          z = pIndex * BLOCK_D // spans 0 to 1, 1 to 2, 2 to 3
        } else {
          x = pIndex * BLOCK_D // spans 0 to 1, 1 to 2, 2 to 3
          z = 0 // spans 0 to 3
        }

        const width = isHorizontal ? BLOCK_W : BLOCK_D
        const depth = isHorizontal ? BLOCK_D : BLOCK_W

        const isProtected = lIndex >= TOWER_LAYERS - PROTECTED_TOP
        const difficulty = DifficultyManager.getDifficulty(pIndex, lIndex, layers)

        list.push({
          layer: lIndex,
          position: pIndex,
          x,
          y,
          z,
          width,
          depth,
          height: BLOCK_H,
          selectable: interactive && !isProtected,
          difficulty
        })
      })
    })

    // Painter's algorithm: sort by depth. 
    // Farther back comes first: low y (drawn first), low x, low z
    list.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y
      return (a.x + a.z) - (b.x + b.z)
    })

    return list
  }, [layers, interactive])

  // Isometric projection function - unitWidth is passed in to scale dynamically
  const toIso = (x, y, z, unitWidth) => {
    const angle = Math.PI / 6 // 30 degrees
    const isoX = (x - z) * Math.cos(angle) * unitWidth
    const isoY = ((x + z) * Math.sin(angle) - y) * unitWidth
    return { x: isoX, y: isoY }
  }

  const drawTower = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height)

    // Dynamic scale: tower height is TOWER_LAYERS * BLOCK_H in world units.
    // We want the tower to fill ~80% of the canvas height.
    // The iso Y range for the full tower is approximately TOWER_LAYERS * sin(30°) * unitWidth
    // plus the x+z contribution. Let's compute unitWidth so it fits.
    const towerWorldHeight = TOWER_LAYERS * BLOCK_H
    const maxIsoSpread = towerWorldHeight + 6 // 6 = max(x+z) for base spread
    const unitWidth = Math.min(width / 12, (height * 0.78) / maxIsoSpread)

    // Center tower in canvas
    const originX = width / 2
    // Bottom of the tower should be near the bottom of canvas
    const originY = height - Math.max(30, height * 0.06)

    blocks.forEach((block) => {
      const isHovered = hoveredPiece?.layer === block.layer && hoveredPiece?.position === block.position

      // Calculate path for block faces
      const pTopLeft = toIso(block.x, block.y + block.height, block.z, unitWidth)
      const pTopRight = toIso(block.x + block.width, block.y + block.height, block.z, unitWidth)
      const pTopBottom = toIso(block.x + block.width, block.y + block.height, block.z + block.depth, unitWidth)
      const pTopLeftBottom = toIso(block.x, block.y + block.height, block.z + block.depth, unitWidth)

      const pBottomLeft = toIso(block.x, block.y, block.z, unitWidth)
      const pBottomRight = toIso(block.x + block.width, block.y, block.z, unitWidth)
      const pBottomBottom = toIso(block.x + block.width, block.y, block.z + block.depth, unitWidth)
      const pBottomLeftBottom = toIso(block.x, block.y, block.z + block.depth, unitWidth)

      ctx.save()
      ctx.translate(originX, originY)

      // Colors 
      // Base wood color: pastel tone with some shading
      let topColor = '#E6CBA8'
      let leftColor = '#D4B895'
      let rightColor = '#C3A682'

      const isOpponentHovered = opponentHoveredPiece?.layer === block.layer && opponentHoveredPiece?.position === block.position

      if (isOpponentHovered) {
        topColor = '#FFA8A8' // Pastel red/pink for opponent hover
        leftColor = '#E68A8A'
        rightColor = '#CC7070'
      } else if (import.meta.env.DEV) {
        if (block.difficulty === GAME.DIFFICULTY.EASY) {
          topColor = '#A8DDFD'
          leftColor = '#8AC3E6'
          rightColor = '#72AAD0'
        } else if (block.difficulty === GAME.DIFFICULTY.MEDIUM) {
          topColor = '#FDFD96'
          leftColor = '#E6E67A'
          rightColor = '#CFCF61'
        } else if (block.difficulty === GAME.DIFFICULTY.HARD) {
          topColor = '#FFB347'
          leftColor = '#E69A33'
          rightColor = '#CC8220'
        }
      }

      if (isHovered && block.selectable && !isOpponentHovered) {
        topColor = '#B2FBA5' // Pastel green highlight
        leftColor = '#9EE392'
        rightColor = '#8DCC82'
      } else if (isHovered && !block.selectable) {
        topColor = '#FFB3B3' // Pastel red highlight (invalid)
        leftColor = '#E6A1A1'
        rightColor = '#CC8F8F'
      }

      ctx.strokeStyle = '#8E735B'
      ctx.lineWidth = 1
      ctx.lineJoin = 'round'

      // Left visible face (Left -> Front -> BottomFront -> BottomLeft)
      ctx.beginPath()
      ctx.moveTo(pTopLeftBottom.x, pTopLeftBottom.y)
      ctx.lineTo(pTopBottom.x, pTopBottom.y)
      ctx.lineTo(pBottomBottom.x, pBottomBottom.y)
      ctx.lineTo(pBottomLeftBottom.x, pBottomLeftBottom.y)
      ctx.closePath()
      ctx.fillStyle = leftColor
      ctx.fill()
      ctx.stroke()

      // Right visible face (Front -> Right -> BottomRight -> BottomFront)
      ctx.beginPath()
      ctx.moveTo(pTopBottom.x, pTopBottom.y)
      ctx.lineTo(pTopRight.x, pTopRight.y)
      ctx.lineTo(pBottomRight.x, pBottomRight.y)
      ctx.lineTo(pBottomBottom.x, pBottomBottom.y)
      ctx.closePath()
      ctx.fillStyle = rightColor
      ctx.fill()
      ctx.stroke()

      // Top face
      ctx.beginPath()
      ctx.moveTo(pTopLeft.x, pTopLeft.y)
      ctx.lineTo(pTopRight.x, pTopRight.y)
      ctx.lineTo(pTopBottom.x, pTopBottom.y)
      ctx.lineTo(pTopLeftBottom.x, pTopLeftBottom.y)
      ctx.closePath()
      ctx.fillStyle = topColor
      ctx.fill()
      ctx.stroke()

      // Store a bounding box approximation for click detection
      // Note: precise hit-testing in isometric is complex, but we can do it by saving paths
      block.hitPath = new Path2D()
      block.hitPath.moveTo(pTopLeft.x + originX, pTopLeft.y + originY)
      block.hitPath.lineTo(pTopRight.x + originX, pTopRight.y + originY)
      block.hitPath.lineTo(pBottomRight.x + originX, pBottomRight.y + originY)
      block.hitPath.lineTo(pBottomBottom.x + originX, pBottomBottom.y + originY)
      block.hitPath.lineTo(pBottomLeftBottom.x + originX, pBottomLeftBottom.y + originY)
      block.hitPath.lineTo(pTopLeftBottom.x + originX, pTopLeftBottom.y + originY) // Added missing vertex
      block.hitPath.lineTo(pTopLeft.x + originX, pTopLeft.y + originY)

      ctx.restore()
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const render = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      const ctx = canvas.getContext('2d')
      drawTower(ctx, canvas.width, canvas.height)
    }

    render()

    const ro = new ResizeObserver(render)
    ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [blocks, hoveredPiece, opponentHoveredPiece])

  // Hit-test helper: finds the block at the given canvas coordinates
  const hitTestAt = (canvasX, canvasY) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    
    // Check backwards (top-most blocks first)
    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i]
      if (block.hitPath && ctx.isPointInPath(block.hitPath, canvasX, canvasY)) {
        return { layer: block.layer, position: block.position, selectable: block.selectable }
      }
    }
    return null
  }

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  // To distinguish taps from swipes/drags
  const pointerDownPos = useRef(null)

  const handlePointerDown = (e) => {
    if (!interactive) return
    const coords = getCanvasCoords(e)
    pointerDownPos.current = { x: e.clientX, y: e.clientY } // using clientX/Y for distance
    
    // Optional: could pre-highlight on touch start for better mobile feel
    const found = hitTestAt(coords.x, coords.y)
    if (found?.selectable) {
      setHoveredPiece(found)
    }
  }

  const handlePointerMove = (e) => {
    if (!interactive) return
    const { x, y } = getCanvasCoords(e)
    const found = hitTestAt(x, y)

    // On touch devices, dragging might constantly change hovered piece.
    if (found?.layer !== hoveredPiece?.layer || found?.position !== hoveredPiece?.position) {
      setHoveredPiece(found)
    }
  }

  const handlePointerLeave = () => {
    if (interactive) setHoveredPiece(null)
    pointerDownPos.current = null
  }

  // Use pointerUp for selection — works on both mobile (tap) and desktop (click)
  const handlePointerUp = (e) => {
    if (!interactive) return
    
    // Check if it was a drag rather than a tap
    if (pointerDownPos.current) {
      const dx = e.clientX - pointerDownPos.current.x
      const dy = e.clientY - pointerDownPos.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // If moved more than 10 pixels, treat as a scroll/drag, not a tap
      if (distance > 10) {
        pointerDownPos.current = null
        setHoveredPiece(null)
        return
      }
    }
    
    pointerDownPos.current = null

    const { x, y } = getCanvasCoords(e)
    const hit = hitTestAt(x, y)

    if (hit && hit.selectable && onSelectPiece) {
      onSelectPiece(hit.layer, hit.position)
    }
    // Clear hover after selection on mobile
    setHoveredPiece(null)
  }

  return (
    <div className="h-full w-full relative" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full outline-none"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerLeave}
        onPointerUp={handlePointerUp}
      />
      {import.meta.env.DEV && (
        <div className="absolute bottom-20 left-4 bg-white/90 p-3 rounded-lg text-sm pointer-events-none z-10 shadow-lg border border-sky-100">
          <div className="font-black mb-2 text-primary">DEV: Dificultad</div>
          <div className="flex items-center gap-2 mb-1"><div className="w-4 h-4 bg-[#A8DDFD] border border-[#72AAD0] rounded-sm"></div> Fácil</div>
          <div className="flex items-center gap-2 mb-1"><div className="w-4 h-4 bg-[#FDFD96] border border-[#CFCF61] rounded-sm"></div> Medio</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#FFB347] border border-[#CC8220] rounded-sm"></div> Difícil</div>
        </div>
      )}
    </div>
  )
}
