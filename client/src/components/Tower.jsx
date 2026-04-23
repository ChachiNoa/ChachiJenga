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
const UNIT_WIDTH = 25 // pixel scale

export default function Tower({ layers, onSelectPiece, interactive = true }) {
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

  // Isometric projection function
  const toIso = (x, y, z) => {
    const angle = Math.PI / 6 // 30 degrees
    const isoX = (x - z) * Math.cos(angle) * UNIT_WIDTH
    const isoY = ((x + z) * Math.sin(angle) - y) * UNIT_WIDTH
    return { x: isoX, y: isoY }
  }

  const drawTower = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height)

    // Center tower in canvas
    const originX = width / 2
    // Bottom of the tower should be near the bottom of canvas
    const originY = height - 50 

    blocks.forEach((block) => {
      const isHovered = hoveredPiece?.layer === block.layer && hoveredPiece?.position === block.position

      // Calculate path for block faces
      const pTopLeft = toIso(block.x, block.y + block.height, block.z)
      const pTopRight = toIso(block.x + block.width, block.y + block.height, block.z)
      const pTopBottom = toIso(block.x + block.width, block.y + block.height, block.z + block.depth)
      const pTopLeftBottom = toIso(block.x, block.y + block.height, block.z + block.depth)

      const pBottomLeft = toIso(block.x, block.y, block.z)
      const pBottomRight = toIso(block.x + block.width, block.y, block.z)
      const pBottomBottom = toIso(block.x + block.width, block.y, block.z + block.depth)
      const pBottomLeftBottom = toIso(block.x, block.y, block.z + block.depth)

      ctx.save()
      ctx.translate(originX, originY)

      // Colors 
      // Base wood color: pastel tone with some shading
      let topColor = '#E6CBA8'
      let leftColor = '#D4B895'
      let rightColor = '#C3A682'

      // DEV MODE: Color coding by difficulty
      if (import.meta.env.DEV) {
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

      if (isHovered && block.selectable) {
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
      block.hitPath.lineTo(pBottomRight.x + originX, pBottomRight.y + originY) // Approx bounds
      block.hitPath.lineTo(pBottomBottom.x + originX, pBottomBottom.y + originY)
      block.hitPath.lineTo(pBottomLeftBottom.x + originX, pBottomLeftBottom.y + originY)
      block.hitPath.lineTo(pTopLeft.x + originX, pTopLeft.y + originY)

      ctx.restore()
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Fit parent
    const parent = canvas.parentElement
    canvas.width = parent.clientWidth
    canvas.height = parent.clientHeight

    const ctx = canvas.getContext('2d')
    drawTower(ctx, canvas.width, canvas.height)
  }, [blocks, hoveredPiece])

  const handlePointerMove = (e) => {
    if (!interactive) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    let found = null
    
    // Check backwards (top-most blocks first)
    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i]
      if (block.hitPath && ctx.isPointInPath(block.hitPath, x, y)) {
        found = { layer: block.layer, position: block.position, selectable: block.selectable }
        break
      }
    }

    if (found?.layer !== hoveredPiece?.layer || found?.position !== hoveredPiece?.position) {
      setHoveredPiece(found)
    }
  }

  const handlePointerLeave = () => {
    if (interactive) setHoveredPiece(null)
  }

  const handleClick = () => {
    if (interactive && hoveredPiece && hoveredPiece.selectable) {
      if (onSelectPiece) {
        onSelectPiece(hoveredPiece.layer, hoveredPiece.position)
      }
    }
  }

  return (
    <div className="h-full w-full relative touch-none">
      <canvas
        ref={canvasRef}
        className="block h-full w-full outline-none"
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerLeave}
        onClick={handleClick}
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
