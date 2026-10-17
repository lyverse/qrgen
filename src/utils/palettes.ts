export interface Palette {
  label: string
  fg: string
  bg: string
}

export const palettes: Palette[] = [
  { label: 'Mono', fg: '#000000', bg: '#ffffff' },
  { label: 'Ink', fg: '#111111', bg: '#f5f5f5' },
  { label: 'Matrix', fg: '#00ff41', bg: '#000000' },
  { label: 'Amber', fg: '#ffb000', bg: '#0a0a0a' },
  { label: 'Cyan', fg: '#00e5ff', bg: '#001018' },
  { label: 'Crimson', fg: '#c81e3a', bg: '#fff5f5' },
  { label: 'Violet', fg: '#7c3aed', bg: '#ffffff' },
  { label: 'Ocean', fg: '#0b3d91', bg: '#e6f0ff' },
]
