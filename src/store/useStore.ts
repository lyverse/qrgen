import { create } from 'zustand'
import type { Preset, QrConfig } from '@/types'
import type { QrMatrix } from '@/utils/qr'

export const defaultConfig: QrConfig = {
  contentType: 'url',
  content: 'https://example.com',
  ecc: 'M',
  quietZone: 4,
  fg: '#000000',
  bg: '#ffffff',
  transparentBg: false,
  gradient: {
    enabled: false,
    type: 'linear',
    from: '#000000',
    to: '#444444',
    angle: 45,
  },
  dotStyle: 'square',
  eyeStyle: 'square',
  useEyeColor: false,
  eyeColor: '#000000',
  logo: null,
  logoSize: 0.22,
  logoPadding: true,
  exportSize: 1024,
}

function normalizeConfig(input: Partial<QrConfig> | null | undefined): QrConfig {
  if (!input) return { ...defaultConfig }
  const merged: QrConfig = {
    ...defaultConfig,
    ...input,
    gradient: { ...defaultConfig.gradient, ...(input.gradient ?? {}) },
  }
  return merged
}

interface History {
  past: QrConfig[]
  future: QrConfig[]
}

interface QrStore {
  config: QrConfig
  presets: Preset[]
  history: History
  matrix: QrMatrix | null
  error: string | null
  sidebarOpen: boolean

  setConfig: (config: QrConfig) => void
  updateConfig: (partial: Partial<QrConfig>) => void
  resetConfig: () => void
  loadPreset: (preset: Preset) => void
  savePreset: (name: string) => void
  deletePreset: (id: string) => void
  setMatrix: (matrix: QrMatrix | null) => void
  setError: (error: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  undo: () => void
  redo: () => void
}

const loadPresets = (): Preset[] => {
  try {
    const raw = localStorage.getItem('qrgen-presets')
    return raw ? (JSON.parse(raw) as Preset[]) : []
  } catch {
    return []
  }
}

const savePresets = (presets: Preset[]): void => {
  try {
    localStorage.setItem('qrgen-presets', JSON.stringify(presets))
  } catch {
    // storage unavailable; ignore
  }
}

let lastPushTime = 0

const pushHistory = (prev: QrConfig, history: History): History => ({
  past: [...history.past, { ...prev }].slice(-50),
  future: [],
})

export const useStore = create<QrStore>((set, get) => ({
  config: { ...defaultConfig },
  presets: loadPresets(),
  history: { past: [], future: [] },
  matrix: null,
  error: null,
  sidebarOpen: true,

  setConfig: (config) => {
    const { config: prev, history } = get()
    set({ config: normalizeConfig(config), history: pushHistory(prev, history) })
  },

  updateConfig: (partial) => {
    const { config: prev, history } = get()
    const now = Date.now()
    let past = history.past
    if (now - lastPushTime > 500) {
      past = [...past, { ...prev }].slice(-50)
      lastPushTime = now
    }
    set({
      config: { ...prev, ...partial },
      history: { past, future: [] },
    })
  },

  resetConfig: () => {
    const { config: prev, history } = get()
    set({ config: { ...defaultConfig }, history: pushHistory(prev, history) })
  },

  loadPreset: (preset) => {
    const { config: prev, history } = get()
    set({ config: normalizeConfig(preset.config), history: pushHistory(prev, history) })
  },

  savePreset: (name) => {
    const state = get()
    const newPreset: Preset = {
      id: crypto.randomUUID(),
      name,
      config: { ...state.config },
    }
    const updated = [...state.presets, newPreset]
    set({ presets: updated })
    savePresets(updated)
  },

  deletePreset: (id) => {
    const updated = get().presets.filter((p) => p.id !== id)
    set({ presets: updated })
    savePresets(updated)
  },

  setMatrix: (matrix) => set({ matrix }),
  setError: (error) => set({ error }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  undo: () => {
    const { config: current, history } = get()
    if (history.past.length === 0) return
    const prev = history.past[history.past.length - 1]
    set({
      config: prev,
      history: {
        past: history.past.slice(0, -1),
        future: [{ ...current }, ...history.future].slice(0, 50),
      },
    })
  },

  redo: () => {
    const { config: current, history } = get()
    if (history.future.length === 0) return
    const next = history.future[0]
    set({
      config: next,
      history: {
        past: [...history.past, { ...current }].slice(-50),
        future: history.future.slice(1),
      },
    })
  },
}))
