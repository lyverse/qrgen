import type { QrConfig } from '@/types'
import { FINDER_SIZE, finderOrigins, isFinderModule, type QrMatrix } from './qr'
import { roundRectPath } from './shapes'

export interface PaintOptions {
  logo?: HTMLImageElement | null
  forceBg?: string
}

function makeModulePaint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: QrConfig
): string | CanvasGradient {
  if (!config.gradient.enabled) return config.fg

  const { from, to, type, angle } = config.gradient
  if (type === 'radial') {
    const r = Math.hypot(width, height) / 2
    const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, r)
    g.addColorStop(0, from)
    g.addColorStop(1, to)
    return g
  }

  const rad = (angle * Math.PI) / 180
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)
  const half = Math.max(width, height) / 2
  const g = ctx.createLinearGradient(
    width / 2 - dx * half,
    height / 2 - dy * half,
    width / 2 + dx * half,
    height / 2 + dy * half
  )
  g.addColorStop(0, from)
  g.addColorStop(1, to)
  return g
}

function drawModule(
  ctx: CanvasRenderingContext2D,
  style: QrConfig['dotStyle'],
  x: number,
  y: number,
  s: number
): void {
  ctx.beginPath()
  if (style === 'dots') {
    ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  if (style === 'rounded') {
    roundRectPath(ctx, x, y, s, s, s * 0.3)
    ctx.fill()
    return
  }
  if (style === 'diamond') {
    const m = s / 2
    ctx.moveTo(x + m, y)
    ctx.lineTo(x + s, y + m)
    ctx.lineTo(x + m, y + s)
    ctx.lineTo(x, y + m)
    ctx.closePath()
    ctx.fill()
    return
  }
  ctx.rect(x, y, s, s)
  ctx.fill()
}

function drawEye(
  ctx: CanvasRenderingContext2D,
  style: QrConfig['eyeStyle'],
  x: number,
  y: number,
  s: number
): void {
  const outer = s * FINDER_SIZE
  const inset = s / 2

  ctx.beginPath()
  if (style === 'circle') {
    ctx.arc(x + outer / 2, y + outer / 2, outer / 2 - inset, 0, Math.PI * 2)
  } else if (style === 'rounded') {
    roundRectPath(ctx, x + inset, y + inset, outer - inset * 2, outer - inset * 2, s * 1.1)
  } else {
    ctx.rect(x + inset, y + inset, outer - inset * 2, outer - inset * 2)
  }
  ctx.lineWidth = s
  ctx.stroke()

  const is = s * 3
  const ix = x + s * 2
  const iy = y + s * 2
  ctx.beginPath()
  if (style === 'circle') {
    ctx.arc(ix + is / 2, iy + is / 2, is / 2, 0, Math.PI * 2)
  } else if (style === 'rounded') {
    roundRectPath(ctx, ix, iy, is, is, s * 0.9)
  } else {
    ctx.rect(ix, iy, is, is)
  }
  ctx.fill()
}

export function paintQr(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  matrix: QrMatrix,
  config: QrConfig,
  options: PaintOptions = {}
): void {
  const { size, modules } = matrix
  const total = size + config.quietZone * 2
  const cell = Math.min(width, height) / total
  const originX = (width - cell * total) / 2 + cell * config.quietZone
  const originY = (height - cell * total) / 2 + cell * config.quietZone

  ctx.clearRect(0, 0, width, height)

  const bg = options.forceBg ?? (config.transparentBg ? null : config.bg)
  if (bg) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, width, height)
  }

  const modulePaint = makeModulePaint(ctx, width, height, config)
  ctx.fillStyle = modulePaint
  ctx.strokeStyle = config.useEyeColor ? config.eyeColor : modulePaint

  for (let r = 0; r < size; r++) {
    const row = modules[r]
    for (let c = 0; c < size; c++) {
      if (!row[c]) continue
      if (isFinderModule(r, c, size)) continue
      drawModule(ctx, config.dotStyle, originX + c * cell, originY + r * cell, cell)
    }
  }

  for (const o of finderOrigins(size)) {
    drawEye(ctx, config.eyeStyle, originX + o.col * cell, originY + o.row * cell, cell)
  }

  if (options.logo) {
    const qrPx = cell * size
    const logoPx = qrPx * Math.max(0, Math.min(0.6, config.logoSize))
    if (logoPx > 0) {
      const lx = (width - logoPx) / 2
      const ly = (height - logoPx) / 2
      const bgFill = options.forceBg ?? (config.transparentBg ? null : config.bg)
      if (config.logoPadding) {
        const pad = logoPx * 0.14
        ctx.clearRect(lx - pad, ly - pad, logoPx + pad * 2, logoPx + pad * 2)
        if (bgFill) {
          ctx.fillStyle = bgFill
          ctx.fillRect(lx - pad, ly - pad, logoPx + pad * 2, logoPx + pad * 2)
        }
      }
      ctx.drawImage(options.logo, lx, ly, logoPx, logoPx)
    }
  }
}
