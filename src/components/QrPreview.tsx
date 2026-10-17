import { useCallback, useEffect, useRef, useState } from 'react'
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { useLogo } from '@/hooks/useLogo'
import { paintQr } from '@/utils/renderCanvas'

const RESOLUTION = 1024

export function QrPreview() {
  const matrix = useStore((s) => s.matrix)
  const config = useStore(useShallow((s) => s.config))
  const error = useStore((s) => s.error)
  const logo = useLogo(config.logo)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(360)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const pinchRef = useRef<{
    dist: number
    zoom: number
    panX: number
    panY: number
    midX: number
    midY: number
  } | null>(null)
  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  const fitRef = useRef(fit)

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { panRef.current = pan }, [pan])
  useEffect(() => { fitRef.current = fit }, [fit])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setFit(Math.max(120, Math.min(rect.width, rect.height) - 48))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !matrix) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = RESOLUTION
    canvas.height = RESOLUTION
    paintQr(ctx, RESOLUTION, RESOLUTION, matrix, config, { logo })
  }, [matrix, config, logo])

  const startDrag = useCallback((x: number, y: number) => {
    if (zoomRef.current <= 1) return
    dragRef.current = { x, y, panX: panRef.current.x, panY: panRef.current.y }
    setDragging(true)
  }, [])

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    const d = dragRef.current
    if (!d) return
    setPan({ x: d.panX + (clientX - d.x), y: d.panY + (clientY - d.y) })
  }, [])

  const endDrag = useCallback(() => {
    dragRef.current = null
    setDragging(false)
  }, [])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const onTouchStart = (e: TouchEvent) => {
      const touches = e.touches
      if (touches.length === 2) {
        e.preventDefault()
        const [t0, t1] = [touches[0], touches[1]]
        const rect = el.getBoundingClientRect()
        pinchRef.current = {
          dist: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY),
          zoom: zoomRef.current,
          panX: panRef.current.x,
          panY: panRef.current.y,
          midX: (t0.clientX + t1.clientX) / 2 - rect.left,
          midY: (t0.clientY + t1.clientY) / 2 - rect.top,
        }
        return
      }
      if (touches.length === 1) startDrag(touches[0].clientX, touches[0].clientY)
    }
    const onTouchMove = (e: TouchEvent) => {
      const touches = e.touches
      if (touches.length === 2 && pinchRef.current) {
        e.preventDefault()
        const [t0, t1] = [touches[0], touches[1]]
        const p = pinchRef.current
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
        setZoom(Math.max(0.5, Math.min(4, p.zoom * (dist / p.dist))))
        return
      }
      if (touches.length === 1) moveDrag(touches[0].clientX, touches[0].clientY)
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchRef.current = null
      if (e.touches.length === 0) endDrag()
    }
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [startDrag, moveDrag, endDrag])

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  return (
    <div className="preview-container qr-preview">
      <div className="preview-toolbar">
        <div className="preview-info">
          {matrix ? (
            <>
              <span>v{matrix.version}</span>
              <span className="sep">|</span>
              <span>{matrix.size}×{matrix.size}</span>
              <span className="sep">|</span>
              <span>ECC {matrix.ecc}</span>
            </>
          ) : (
            <span>No output</span>
          )}
        </div>
        <div className="qr-zoom">
          <button className="btn btn-xs" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} title="Zoom out">
            <ZoomOut size={14} />
          </button>
          <span className="qr-zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="btn btn-xs" onClick={() => setZoom((z) => Math.min(4, z + 0.25))} title="Zoom in">
            <ZoomIn size={14} />
          </button>
          <button className="btn btn-xs" onClick={resetView} title="Reset view">
            <RotateCcw size={14} />
          </button>
          <button className="btn btn-xs" onClick={resetView} title="Fit to screen">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {error && <div className="error-banner"><span>{error}</span></div>}

      <div
        ref={wrapperRef}
        className="preview-canvas-wrapper qr-canvas-wrapper"
        onWheel={(e) => { e.preventDefault(); setZoom((z) => (e.deltaY < 0 ? Math.min(4, z + 0.1) : Math.max(0.5, z - 0.1))) }}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {matrix ? (
          <div
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <div
              className={`qr-canvas-frame${config.transparentBg ? ' qr-checker' : ''}`}
              style={{ width: fit, height: fit }}
            >
              <canvas ref={canvasRef} className="qr-canvas" style={{ width: fit, height: fit }} />
            </div>
          </div>
        ) : (
          <div className="qr-empty">
            <span className="qr-empty-icon">▚</span>
            <p>Enter content to generate a QR code</p>
          </div>
        )}
      </div>
    </div>
  )
}
