import { useEffect, useRef, useState } from 'react'
import { ScanLine } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { useLogo } from '@/hooks/useLogo'
import { paintQr } from '@/utils/renderCanvas'
import type { QrMatrix } from '@/utils/qr'

const RESOLUTION = 1024

export function QrPreview() {
  const matrix = useStore((s) => s.matrix)
  const config = useStore(useShallow((s) => s.config))
  const error = useStore((s) => s.error)
  const logo = useLogo(config.logo)

  const wrapperRef = useRef<HTMLDivElement>(null)
  // Two stacked canvases alternate as the visible frame: while the front one
  // fades out, the freshly painted back one fades in, giving a cross-fade
  // between previews as the user types.
  const canvasARef = useRef<HTMLCanvasElement>(null)
  const canvasBRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef<'a' | 'b'>('a')
  const prevMatrixRef = useRef<QrMatrix | null>(null)
  const [active, setActive] = useState<'a' | 'b'>('a')
  const [fit, setFit] = useState(360)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setFit(Math.max(120, Math.min(rect.width, rect.height) - 96))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvasA = canvasARef.current
    const canvasB = canvasBRef.current
    if (!canvasA || !canvasB || !matrix) return

    const front = activeRef.current === 'a' ? canvasA : canvasB
    const back = activeRef.current === 'a' ? canvasB : canvasA

    // A new matrix (content/ecc change) cross-fades from the previous frame;
    // a style-only change repaints the visible canvas in place.
    const contentChanged = prevMatrixRef.current !== null && prevMatrixRef.current !== matrix
    const target = contentChanged ? back : front

    target.width = RESOLUTION
    target.height = RESOLUTION
    const ctx = target.getContext('2d')
    if (!ctx) return
    paintQr(ctx, RESOLUTION, RESOLUTION, matrix, config, { logo })

    prevMatrixRef.current = matrix

    if (contentChanged) {
      const next = activeRef.current === 'a' ? 'b' : 'a'
      activeRef.current = next
      setActive(next)
    }
  }, [matrix, config, logo])

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
      </div>

      {error && <div className="error-banner"><span>{error}</span></div>}

      <div ref={wrapperRef} className="preview-canvas-wrapper qr-canvas-wrapper">
        {matrix ? (
          <div className="qr-stage">
            <div
              className={`qr-card${config.transparentBg ? ' qr-checker' : ''}`}
              style={{ width: fit, height: fit }}
            >
              <div className="qr-canvas-stack">
                <canvas ref={canvasARef} className={`qr-canvas${active === 'a' ? ' is-active' : ''}`} />
                <canvas ref={canvasBRef} className={`qr-canvas${active === 'b' ? ' is-active' : ''}`} />
              </div>
            </div>
            <div className="qr-caption">
              <ScanLine size={13} />
              <span>Scan with your camera</span>
            </div>
          </div>
        ) : (
          <div className="qr-empty">
            <div className="qr-empty-mark">▚</div>
            <p>Nothing to render</p>
            <span className="qr-empty-hint">Enter content to generate a QR code</span>
          </div>
        )}
      </div>
    </div>
  )
}
