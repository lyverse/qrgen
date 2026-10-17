import { useEffect, useRef } from 'react'

const CHARS = {
  foam: ['*', '※', '✦', '⁕'],
  surface: ['~', '≈', '≋'],
  shallow: ['-', '=', '≡'],
  mid: ['░', '▒', '▓'],
  deep: ['█', '■', '▮'],
}

const CELL = 16
const LAYERS = 2
const SPEED = 0.3
const FPS = 30
const FRAME_MS = 1000 / FPS

class Noise2D {
  private readonly perm: number[]

  constructor(seed: number) {
    const p = Array.from({ length: 256 }, (_, i) => i)
    let s = seed
    for (let i = 255; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280
      const j = Math.floor((s / 233280) * (i + 1))
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    this.perm = []
    for (let i = 0; i < 512; i++) this.perm.push(p[i & 255])
  }

  noise(x: number, y: number): number {
    const ix = Math.floor(x) & 255
    const iy = Math.floor(y) & 255
    const fx = x - Math.floor(x)
    const fy = y - Math.floor(y)
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const p = this.perm
    const aa = p[p[ix] + iy]
    const ab = p[p[ix] + iy + 1]
    const ba = p[p[ix + 1] + iy]
    const bb = p[p[ix + 1] + iy + 1]
    return (aa + (ba - aa) * sx + (ab - aa + (bb - ab - ba + aa) * sx) * sy) / 128 - 1
  }
}

function pick(arr: string[], t: number): string {
  return arr[Math.min(arr.length - 1, Math.floor(Math.max(0, t) * arr.length))]
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function WaveBackground({
  light = false,
  dim = false,
}: {
  light?: boolean
  dim?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rgb = light ? (dim ? '140,140,140' : '255,255,255') : '0,0,0'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const glyphTiles = new Map<string, HTMLCanvasElement>()
    const makeTile = (char: string): HTMLCanvasElement => {
      const tile = document.createElement('canvas')
      tile.width = CELL
      tile.height = CELL
      const g = tile.getContext('2d')
      if (g) {
        g.font = `${CELL}px "Courier New", monospace`
        g.textBaseline = 'top'
        g.fillStyle = `rgb(${rgb})`
        g.fillText(char, 0, 0)
      }
      return tile
    }
    for (const group of Object.values(CHARS)) {
      for (const ch of group) {
        if (!glyphTiles.has(ch)) glyphTiles.set(ch, makeTile(ch))
      }
    }

    const noise = new Noise2D(Math.floor(Math.random() * 999999))
    const maxAlpha = dim ? 0.07 : 0.12

    const draw = (t: number) => {
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      if (W === 0 || H === 0) return

      const dpr = window.devicePixelRatio || 1
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.globalAlpha = 1

      const cols = Math.ceil(W / CELL)
      const rows = Math.ceil(H / CELL)

      for (let layer = LAYERS - 1; layer >= 0; layer--) {
        const ld = layer / 2
        const amp = 0.7 * (1 - ld * 0.3)
        const spd = 1.0 * (1 - ld * 0.5)
        const freq = 1.5

        const colWave = new Array<number>(cols)
        for (let gx = 0; gx < cols; gx++) {
          const x = gx / cols
          colWave[gx] =
            Math.sin(x * freq * Math.PI * 2 + t * spd) * amp +
            Math.sin(x * freq * 1.5 * Math.PI * 2 + t * spd * 1.3) * amp * 0.5 +
            Math.sin(x * freq * 2.5 * Math.PI * 2 + t * spd * 0.7) * amp * 0.3
        }

        for (let gy = 0; gy < rows; gy++) {
          const y = gy / rows
          for (let gx = 0; gx < cols; gx++) {
            const x = gx / cols

            const n = noise.noise(x * freq * 2 + t * spd * 0.1, y * freq * 2 + layer * 0.5)
            const wave = colWave[gx] + n * 0.3 * amp
            const norm = clamp01((wave / 0.7 + 1) / 2)

            let char: string
            let alpha: number

            if (norm > 0.6 && wave > 0) {
              char = pick(CHARS.foam, ((norm - 0.6) / 0.4) * 0.7 + Math.random() * 0.3)
              alpha = 0.02 + norm * 0.03
            } else if (norm > 0.75) {
              char = pick(CHARS.surface, (norm - 0.75) * 4)
              alpha = 0.04 + norm * 0.04
            } else if (norm > 0.55) {
              char = pick(CHARS.shallow, (norm - 0.55) * 5)
              alpha = 0.05 + norm * 0.05
            } else if (norm > 0.35) {
              char = pick(CHARS.mid, (norm - 0.35) * 5)
              alpha = 0.07 + norm * 0.05
            } else if (norm > 0.15) {
              char = pick(CHARS.deep, (norm - 0.15) * 5)
              alpha = 0.09 + norm * 0.05
            } else {
              continue
            }

            alpha *= 1 - ld * 0.3
            if (alpha > maxAlpha) alpha = maxAlpha
            if (alpha <= 0.01) continue

            ctx.globalAlpha = alpha
            ctx.drawImage(glyphTiles.get(char)!, gx * CELL, gy * CELL)
          }
        }
      }
      ctx.globalAlpha = 1
    }

    let raf = 0
    if (reduced) {
      draw(0)
      const onResize = () => draw(0)
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    let prev = performance.now()
    let acc = 0
    let t = 0
    const loop = (now: number) => {
      const dt = now - prev
      prev = now
      acc += dt
      if (acc >= FRAME_MS) {
        draw(t)
        acc = 0
        t += SPEED / FPS
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [rgb, dim])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  )
}
