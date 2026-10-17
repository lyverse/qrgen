import QRCode from 'qrcode'
import type { Ecc } from '@/types'

export interface QrMatrix {
  size: number
  modules: boolean[][]
  version: number
  ecc: Ecc
}

const FINDER = 7

export function buildMatrix(content: string, ecc: Ecc): QrMatrix {
  const qr = QRCode.create(content, { errorCorrectionLevel: ecc })
  const size = qr.modules.size
  const modules: boolean[][] = []
  for (let r = 0; r < size; r++) {
    const row: boolean[] = []
    for (let c = 0; c < size; c++) {
      row.push(qr.modules.get(r, c) === 1)
    }
    modules.push(row)
  }
  return { size, modules, version: qr.version, ecc }
}

export function isFinderModule(row: number, col: number, size: number): boolean {
  const topLeft = row < FINDER && col < FINDER
  const topRight = row < FINDER && col >= size - FINDER
  const bottomLeft = row >= size - FINDER && col < FINDER
  return topLeft || topRight || bottomLeft
}

export function finderOrigins(size: number): Array<{ row: number; col: number }> {
  return [
    { row: 0, col: 0 },
    { row: 0, col: size - FINDER },
    { row: size - FINDER, col: 0 },
  ]
}

export const FINDER_SIZE = FINDER
