import type { QrConfig } from '@/types'
import { FINDER_SIZE, finderOrigins, isFinderModule, type QrMatrix } from './qr'

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function n(v: number): number {
  return Math.round(v * 1000) / 1000
}

function buildGradient(config: QrConfig): string {
  const { from, to, type, angle } = config.gradient
  if (type === 'radial') {
    return `<radialGradient id="qrg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${esc(from)}"/><stop offset="1" stop-color="${esc(to)}"/></radialGradient>`
  }
  const rad = (angle * Math.PI) / 180
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)
  const x1 = 50 - (dx * 100) / 2
  const y1 = 50 - (dy * 100) / 2
  const x2 = 50 + (dx * 100) / 2
  const y2 = 50 + (dy * 100) / 2
  return `<linearGradient id="qrg" x1="${n(x1)}%" y1="${n(y1)}%" x2="${n(x2)}%" y2="${n(y2)}%"><stop offset="0" stop-color="${esc(from)}"/><stop offset="1" stop-color="${esc(to)}"/></linearGradient>`
}

export function buildSvg(matrix: QrMatrix, config: QrConfig, px: number): string {
  const { size, modules } = matrix
  const total = size + config.quietZone * 2
  const cell = px / total
  const originX = (px - cell * total) / 2 + cell * config.quietZone
  const originY = (px - cell * total) / 2 + cell * config.quietZone

  const moduleFill = config.gradient.enabled ? 'url(#qrg)' : config.fg
  const eyeFill = config.useEyeColor ? config.eyeColor : moduleFill

  const parts: string[] = []
  if (!config.transparentBg) {
    parts.push(`<rect width="${n(px)}" height="${n(px)}" fill="${esc(config.bg)}"/>`)
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!modules[r][c]) continue
      if (isFinderModule(r, c, size)) continue
      const x = originX + c * cell
      const y = originY + r * cell
      const s = cell
      if (config.dotStyle === 'dots') {
        parts.push(`<circle cx="${n(x + s / 2)}" cy="${n(y + s / 2)}" r="${n(s / 2)}" fill="${esc(moduleFill)}"/>`)
      } else if (config.dotStyle === 'rounded') {
        parts.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(s)}" height="${n(s)}" rx="${n(s * 0.3)}" fill="${esc(moduleFill)}"/>`)
      } else if (config.dotStyle === 'diamond') {
        const m = s / 2
        parts.push(
          `<polygon points="${n(x + m)},${n(y)} ${n(x + s)},${n(y + m)} ${n(x + m)},${n(y + s)} ${n(x)},${n(y + m)}" fill="${esc(moduleFill)}"/>`
        )
      } else {
        parts.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(s)}" height="${n(s)}" fill="${esc(moduleFill)}"/>`)
      }
    }
  }

  for (const o of finderOrigins(size)) {
    const x = originX + o.col * cell
    const y = originY + o.row * cell
    const s = cell
    const outer = s * FINDER_SIZE
    const inset = s / 2
    const stroke = `fill="none" stroke="${esc(eyeFill)}" stroke-width="${n(s)}"`
    if (config.eyeStyle === 'circle') {
      parts.push(`<circle cx="${n(x + outer / 2)}" cy="${n(y + outer / 2)}" r="${n(outer / 2 - inset)}" ${stroke}/>`)
    } else if (config.eyeStyle === 'rounded') {
      parts.push(
        `<rect x="${n(x + inset)}" y="${n(y + inset)}" width="${n(outer - inset * 2)}" height="${n(outer - inset * 2)}" rx="${n(s * 1.1)}" ${stroke}/>`
      )
    } else {
      parts.push(
        `<rect x="${n(x + inset)}" y="${n(y + inset)}" width="${n(outer - inset * 2)}" height="${n(outer - inset * 2)}" ${stroke}/>`
      )
    }

    const is = s * 3
    const ix = x + s * 2
    const iy = y + s * 2
    if (config.eyeStyle === 'circle') {
      parts.push(`<circle cx="${n(ix + is / 2)}" cy="${n(iy + is / 2)}" r="${n(is / 2)}" fill="${esc(eyeFill)}"/>`)
    } else if (config.eyeStyle === 'rounded') {
      parts.push(`<rect x="${n(ix)}" y="${n(iy)}" width="${n(is)}" height="${n(is)}" rx="${n(s * 0.9)}" fill="${esc(eyeFill)}"/>`)
    } else {
      parts.push(`<rect x="${n(ix)}" y="${n(iy)}" width="${n(is)}" height="${n(is)}" fill="${esc(eyeFill)}"/>`)
    }
  }

  if (config.logo) {
    const qrPx = cell * size
    const logoPx = qrPx * Math.max(0, Math.min(0.6, config.logoSize))
    if (logoPx > 0) {
      const lx = (px - logoPx) / 2
      const ly = (px - logoPx) / 2
      if (config.logoPadding && !config.transparentBg) {
        const pad = logoPx * 0.14
        parts.push(
          `<rect x="${n(lx - pad)}" y="${n(ly - pad)}" width="${n(logoPx + pad * 2)}" height="${n(logoPx + pad * 2)}" fill="${esc(config.bg)}"/>`
        )
      }
      parts.push(
        `<image href="${config.logo}" x="${n(lx)}" y="${n(ly)}" width="${n(logoPx)}" height="${n(logoPx)}" preserveAspectRatio="xMidYMid meet"/>`
      )
    }
  }

  const defs = config.gradient.enabled ? `<defs>${buildGradient(config)}</defs>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${n(px)}" height="${n(px)}" viewBox="0 0 ${n(px)} ${n(px)}">${defs}${parts.join('')}</svg>`
}
