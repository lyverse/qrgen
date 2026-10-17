import { useEffect, useRef, useState } from 'react'
import { ScanLine } from 'lucide-react'
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
    const canvas = canvasRef.current
    if (!canvas || !matrix) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = RESOLUTION
    canvas.height = RESOLUTION
    paintQr(ctx, RESOLUTION, RESOLUTION, matrix, config, { logo })
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
                <canvas ref={canvasRef} className="qr-canvas" />
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
