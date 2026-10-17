import type { QrConfig } from '@/types'

const VERSION = 1
const PREFIX = 'q'

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function fromBase64(value: string): string {
  const bin = atob(value)
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function serializeConfig(config: QrConfig): string {
  const safe: QrConfig = { ...config, logo: null }
  const payload = JSON.stringify({ v: VERSION, config: safe })
  return `${PREFIX}.${toBase64(payload)}`
}

export function deserializeConfig(encoded: string): QrConfig | null {
  try {
    const sep = encoded.indexOf('.')
    if (sep === -1) return null
    if (encoded.slice(0, sep) !== PREFIX) return null
    const raw = fromBase64(encoded.slice(sep + 1))
    const parsed = JSON.parse(raw) as { v: number; config: QrConfig }
    if (parsed.v !== VERSION) return null
    return parsed.config
  } catch {
    return null
  }
}

export function readConfigFromHash(): QrConfig | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  const marker = `#${PREFIX}=`
  const idx = hash.indexOf(marker)
  if (idx === -1) return null
  return deserializeConfig(hash.slice(idx + marker.length))
}

export function shareUrlForConfig(config: QrConfig): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#${PREFIX}=${serializeConfig(config)}`
}
