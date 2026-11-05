import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import type { DemoWire } from '../../lib/demoNetwork'
import { DEMO_DOMAIN_SIZE } from '../../lib/demoNetwork'
import {
  findAllIntersections,
  computeSpanningStructure,
} from '../../lib/networkGeometry'
import { Button } from '../ui/Button'

interface NetworkCanvasProps {
  wires: DemoWire[]
}

interface ViewTransform {
  scale: number
  offsetX: number
  offsetY: number
}

const DEFAULT_VIEW: ViewTransform = { scale: 1, offsetX: 0, offsetY: 0 }
const MIN_SCALE = 0.5
const MAX_SCALE = 8

function distanceToSegment(
  px: number, py: number,
  x1: number, y1: number, x2: number, y2: number,
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = x1 + t * dx
  const cy = y1 + t * dy
  return Math.hypot(px - cx, py - cy)
}


function zoomAt(v: ViewTransform, px: number, py: number, nextScale: number): ViewTransform {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale))
  const ratio = scale / v.scale
  return {
    scale,
    offsetX: px - (px - v.offsetX) * ratio,
    offsetY: py - (py - v.offsetY) * ratio,
  }
}


export function NetworkCanvas({ wires }: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [view, setView] = useState<ViewTransform>(DEFAULT_VIEW)
  const [hoveredWire, setHoveredWire] = useState<number | null>(null)
  const activePointer = useRef<number | null>(null)
  const lastPointer = useRef({ x: 0, y: 0 })

  const intersections = useMemo(() => findAllIntersections(wires), [wires])
  const spanning = useMemo(
    () => computeSpanningStructure(wires, intersections, DEMO_DOMAIN_SIZE),
    [wires, intersections],
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = canvas.clientWidth
    const pixels = Math.round(size * dpr)
    if (canvas.width !== pixels || canvas.height !== pixels) {
      canvas.width = pixels
      canvas.height = pixels
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)

    const styles = getComputedStyle(document.documentElement)
    const accent = styles.getPropertyValue('--color-accent').trim() || '#1f6f78'
    const success = styles.getPropertyValue('--color-success').trim() || '#2f7a4d'
    const border = styles.getPropertyValue('--color-border').trim() || '#e5e5e3'
    const muted = styles.getPropertyValue('--color-muted').trim() || '#6b7280'

    const baseScale = size / DEMO_DOMAIN_SIZE
    const toScreen = (x: number, y: number): [number, number] => [
      (x * baseScale) * view.scale + view.offsetX,
      (y * baseScale) * view.scale + view.offsetY,
    ]

    // Background grid
    ctx.strokeStyle = border
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5
    const gridStep = 5
    for (let gx = 0; gx <= DEMO_DOMAIN_SIZE; gx += gridStep) {
      const [sx1, sy1] = toScreen(gx, 0)
      const [sx2, sy2] = toScreen(gx, DEMO_DOMAIN_SIZE)
      ctx.beginPath()
      ctx.moveTo(sx1, sy1)
      ctx.lineTo(sx2, sy2)
      ctx.stroke()
    }
    for (let gy = 0; gy <= DEMO_DOMAIN_SIZE; gy += gridStep) {
      const [sx1, sy1] = toScreen(0, gy)
      const [sx2, sy2] = toScreen(DEMO_DOMAIN_SIZE, gy)
      ctx.beginPath()
      ctx.moveTo(sx1, sy1)
      ctx.lineTo(sx2, sy2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Wires
    wires.forEach((wire, i) => {
      const [sx1, sy1] = toScreen(wire.x1, wire.y1)
      const [sx2, sy2] = toScreen(wire.x2, wire.y2)

      const isSpanning = spanning.componentWireIndices?.has(i) ?? false
      const isHovered = hoveredWire === i

      ctx.beginPath()
      ctx.moveTo(sx1, sy1)
      ctx.lineTo(sx2, sy2)
      ctx.strokeStyle = isSpanning ? success : accent
      ctx.lineWidth = isHovered ? 2.5 : 1
      ctx.globalAlpha = isHovered ? 1 : isSpanning ? 0.9 : 0.6
      ctx.stroke()
    })
    ctx.globalAlpha = 1

    // Intersection dots
    ctx.fillStyle = muted
    for (const { x, y } of intersections) {
      const [sx, sy] = toScreen(x, y)
      ctx.beginPath()
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [wires, view, hoveredWire, intersections, spanning])

  useEffect(() => {
    draw()
  }, [draw])

  const drawRef = useRef(draw)
  useEffect(() => {
    drawRef.current = draw
  }, [draw])


  /*
  Redraw when the canvas is resized (window or layout change) and when the
  OS switches between light and dark, since the colors are read from css
  */

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const redraw = () => drawRef.current()
    const observer = new ResizeObserver(redraw)
    observer.observe(canvas)
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', redraw)
    return () => {
      observer.disconnect()
      scheme.removeEventListener('change', redraw)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      const factor = Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0015))
      setView((v) => zoomAt(v, e.clientX - rect.left, e.clientY - rect.top, v.scale * factor))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [])



  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== null) return // ignore a second finger
    activePointer.current = e.pointerId
    lastPointer.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }



  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== null) {
      if (e.pointerId !== activePointer.current) return
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }
      setView((v) => ({ ...v, offsetX: v.offsetX + dx, offsetY: v.offsetY + dy }))
      return
    }

    // Hover detection: find nearest wire within a small pixel threshold
    const canvas = canvasRef.current
    if (!canvas || wires.length === 0) return
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const baseScale = rect.width / DEMO_DOMAIN_SIZE

    let closest: number | null = null
    let closestDist = 6 // px threshold
    wires.forEach((wire, i) => {
      const sx1 = wire.x1 * baseScale * view.scale + view.offsetX
      const sy1 = wire.y1 * baseScale * view.scale + view.offsetY
      const sx2 = wire.x2 * baseScale * view.scale + view.offsetX
      const sy2 = wire.y2 * baseScale * view.scale + view.offsetY
      const d = distanceToSegment(px, py, sx1, sy1, sx2, sy2)
      if (d < closestDist) {
        closestDist = d
        closest = i
      }
    })
    setHoveredWire(closest)
  }

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activePointer.current) return
    activePointer.current = null
    // After a cancelled touch the capture is already gone, so check first.
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const resetView = () => setView(DEFAULT_VIEW)
  const zoomBy = (factor: number) => {
    const size = canvasRef.current?.clientWidth ?? 0
    setView((v) => zoomAt(v, size / 2, size / 2, v.scale * factor))
  }
  const zoomIn = () => zoomBy(1.2)
  const zoomOut = () => zoomBy(1 / 1.2)



  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="aspect-square w-full cursor-grab rounded-(--radius-md) border border-border bg-background active:cursor-grabbing touch-none"

          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={() => setHoveredWire(null)}


        />
        <div className="absolute bottom-2 right-2 flex gap-1">
          <Button variant="secondary" size="sm" onClick={zoomOut}>
            −
          </Button>
          <Button variant="secondary" size="sm" onClick={zoomIn}>
            +
          </Button>
          <Button variant="secondary" size="sm" onClick={resetView}>
            Reset View
          </Button>
        </div>
      </div>
    </div>
  )
}