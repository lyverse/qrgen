import type { QrConfig } from '@/types'
import { paintQr } from './renderCanvas'
import { buildSvg } from './renderSvg'
import type { QrMatrix } from './qr'

export interface ExportAssets {
  matrix: QrMatrix
  config: QrConfig
  logo: HTMLImageElement | null
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function makeCanvas(
  matrix: QrMatrix,
  config: QrConfig,
  size: number,
  logo: HTMLImageElement | null,
  forceBg?: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    paintQr(ctx, size, size, matrix, config, { logo, forceBg })
  }
  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function renderPngBlob(
  matrix: QrMatrix,
  config: QrConfig,
  logo: HTMLImageElement | null,
  size: number
): Promise<Blob | null> {
  return canvasToBlob(makeCanvas(matrix, config, size, logo), 'image/png')
}

export async function renderJpegBlob(
  matrix: QrMatrix,
  config: QrConfig,
  logo: HTMLImageElement | null,
  size: number
): Promise<Blob | null> {
  const bg = config.transparentBg ? '#ffffff' : undefined
  return canvasToBlob(makeCanvas(matrix, config, size, logo, bg), 'image/jpeg', 0.95)
}

export function svgString(matrix: QrMatrix, config: QrConfig, size: number): string {
  return buildSvg(matrix, config, size)
}

export async function downloadPng({ matrix, config, logo }: ExportAssets, size: number): Promise<void> {
  const blob = await renderPngBlob(matrix, config, logo, size)
  if (blob) download(blob, 'qrgen.png')
}

export async function downloadJpeg({ matrix, config, logo }: ExportAssets, size: number): Promise<void> {
  const blob = await renderJpegBlob(matrix, config, logo, size)
  if (blob) download(blob, 'qrgen.jpg')
}

export function downloadSvg({ matrix, config }: ExportAssets, size: number): void {
  const blob = new Blob([svgString(matrix, config, size)], { type: 'image/svg+xml;charset=utf-8' })
  download(blob, 'qrgen.svg')
}

export async function copyPngToClipboard(
  { matrix, config, logo }: ExportAssets,
  size: number
): Promise<boolean> {
  if (!navigator.clipboard?.write) return false
  const blob = await renderPngBlob(matrix, config, logo, size)
  if (!blob) return false
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}
