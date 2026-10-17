import { useCallback, useMemo, useRef, useState } from 'react'
import { Download, FileImage, FileCode2, ClipboardCopy, X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { WaveBackground } from './WaveBackground'
import { useLogo } from '@/hooks/useLogo'
import { copyPngToClipboard, downloadPng, svgString, renderJpegBlob } from '@/utils/exporters'

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function ExportMenu() {
  const matrix = useStore((s) => s.matrix)
  const config = useStore(useShallow((s) => s.config))
  const logo = useLogo(config.logo)

  const [morph, setMorph] = useState(false)
  const [animClass, setAnimClass] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const btnRef = useRef<HTMLButtonElement>(null)
  const r = useRef({ x: 0, y: 0, w: 0, h: 0, sx: 1, sy: 1 })

  const assets = useMemo(
    () => (matrix ? { matrix, config, logo } : null),
    [matrix, config, logo]
  )

  const handleCopy = useCallback(async () => {
    if (!assets) return
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    try {
      const ok = await copyPngToClipboard(assets, config.exportSize)
      if (ok) {
        setCopied(true)
        copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      setCopied(false)
    }
  }, [assets, config.exportSize])

  if (!matrix) return null

  const open = () => {
    document.body.style.overflow = 'hidden'
    const rect = btnRef.current!.getBoundingClientRect()
    r.current = {
      x: rect.left,
      y: rect.top,
      w: rect.width,
      h: rect.height,
      sx: window.innerWidth / rect.width,
      sy: window.innerHeight / rect.height,
    }
    setMorph(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimClass('expand')))
    setTimeout(() => setShowPanel(true), 250)
  }

  const close = () => {
    document.body.style.overflow = ''
    setShowPanel(false)
    setAnimClass('collapse')
    setTimeout(() => {
      setAnimClass('')
      setMorph(false)
    }, 800)
  }

  const exportPng = () => {
    if (!assets) return
    close()
    void downloadPng(assets, config.exportSize)
  }

  const exportJpeg = () => {
    if (!assets) return
    close()
    void renderJpegBlob(matrix, config, logo, config.exportSize).then((blob) => {
      if (blob) downloadBlob(blob, 'qrgen.jpg')
    })
  }

  const exportSvg = () => {
    const svg = svgString(matrix, config, config.exportSize)
    close()
    downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'qrgen.svg')
  }

  const d = r.current

  return (
    <>
      <button ref={btnRef} className="btn btn-primary" onClick={open}>
        <Download size={14} />
        Export
      </button>

      {morph && (
        <div
          className={`export-morph${animClass ? ` ${animClass}` : ''}`}
          style={{
            left: d.x,
            top: d.y,
            width: d.w,
            height: d.h,
            '--x': `${d.x}px`,
            '--y': `${d.y}px`,
            '--sx': d.sx,
            '--sy': d.sy,
          } as React.CSSProperties}
        />
      )}

      {showPanel && (
        <div className="export-overlay" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
          <WaveBackground />
          <div className="export-panel">
            <div className="export-panel-header">
              <Download size={14} />
              <span>Export</span>
              <button className="export-panel-close" onClick={close}>
                <X size={14} />
              </button>
            </div>
            <button className="export-option" onClick={exportPng}>
              <FileImage size={16} />
              <div>
                <strong>PNG</strong>
                <span>Transparent-capable image &middot; {config.exportSize}px</span>
              </div>
            </button>
            <button className="export-option" onClick={exportJpeg}>
              <FileImage size={16} />
              <div>
                <strong>JPEG</strong>
                <span>Solid background image &middot; {config.exportSize}px</span>
              </div>
            </button>
            <button className="export-option" onClick={exportSvg}>
              <FileCode2 size={16} />
              <div>
                <strong>SVG</strong>
                <span>Scalable vector &middot; {config.exportSize}px</span>
              </div>
            </button>
            <hr className="export-divider" />
            <button className={`export-option${copied ? ' export-copied' : ''}`} onClick={handleCopy}>
              <ClipboardCopy size={16} />
              <div>
                <strong>{copied ? 'Copied!' : 'Copy PNG'}</strong>
                <span>Copy image to clipboard</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
