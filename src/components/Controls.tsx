import { useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { Image as ImageIcon, Settings2 } from 'lucide-react'
import { contentTemplates, templateFor } from '@/utils/templates'
import { palettes } from '@/utils/palettes'
import type { ContentType, DotStyle, Ecc, EyeStyle } from '@/types'

const dotStyles: DotStyle[] = ['square', 'rounded', 'dots', 'diamond']
const dotLabels: Record<DotStyle, string> = {
  square: 'Square',
  rounded: 'Rounded',
  dots: 'Dots',
  diamond: 'Diamond',
}

const eyeStyles: EyeStyle[] = ['square', 'rounded', 'circle']
const eyeLabels: Record<EyeStyle, string> = {
  square: 'Square',
  rounded: 'Rounded',
  circle: 'Circle',
}

const eccLevels: Ecc[] = ['L', 'M', 'Q', 'H']
const exportSizes = [256, 512, 1024, 2048]

function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const valid = /^[0-9a-fA-F]{6}$/.test(full) ? full : '000000'
  const r = parseInt(valid.slice(0, 2), 16) / 255
  const g = parseInt(valid.slice(2, 4), 16) / 255
  const b = parseInt(valid.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function DotIcon({ style }: { style: DotStyle }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
      {style === 'square' && <rect x="3" y="3" width="14" height="14" />}
      {style === 'rounded' && <rect x="3" y="3" width="14" height="14" rx="4" />}
      {style === 'dots' && <circle cx="10" cy="10" r="7" />}
      {style === 'diamond' && <polygon points="10,2 18,10 10,18 2,10" />}
    </svg>
  )
}

function EyeIcon({ style }: { style: EyeStyle }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      {style === 'square' && (
        <>
          <rect x="2.5" y="2.5" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" />
          <rect x="7" y="7" width="6" height="6" fill="currentColor" />
        </>
      )}
      {style === 'rounded' && (
        <>
          <rect x="2.5" y="2.5" width="15" height="15" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
          <rect x="7" y="7" width="6" height="6" rx="2" fill="currentColor" />
        </>
      )}
      {style === 'circle' && (
        <>
          <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="10" cy="10" r="3" fill="currentColor" />
        </>
      )}
    </svg>
  )
}

function Chevron({
  open,
  className,
  vertical,
}: {
  open: boolean
  className?: string
  vertical?: boolean
}) {
  const rotation = vertical ? (open ? 90 : -90) : open ? 90 : 0
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.15s' }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function Controls() {
  const config = useStore(useShallow((s) => s.config))
  const updateConfig = useStore((s) => s.updateConfig)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const matrix = useStore((s) => s.matrix)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const template = templateFor(config.contentType)
  const inverted = hexLuminance(config.fg) > hexLuminance(config.bg)

  const warnings: string[] = []
  if (config.logo && config.ecc !== 'H') warnings.push('Set error correction to H when using a logo.')
  if (config.quietZone < 2) warnings.push('A quiet zone below 2 modules can hurt scannability.')
  if (inverted && !config.transparentBg) warnings.push('Light-on-dark QR codes are not supported by every scanner.')

  const handleLogo = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateConfig({ logo: typeof reader.result === 'string' ? reader.result : null })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="controls-panel">
      <div className="panel-header panel-header--clickable" onClick={toggleSidebar}>
        <Settings2 size={14} />
        <span>Controls</span>
        <Chevron open={sidebarOpen} className="sidebar-chevron" vertical />
      </div>

      <div className="panel-body">
        {/* Content */}
        <div className="control-group">
          <label className="control-label">
            Content
            <span className="control-value">{config.content.length} chars</span>
          </label>
          <select
            className="font-select qr-type-select"
            value={config.contentType}
            onChange={(e) => {
              const type = e.target.value as ContentType
              updateConfig({ contentType: type, content: templateFor(type).value })
            }}
          >
            {contentTemplates.map((t) => (
              <option key={t.type} value={t.type}>{t.label}</option>
            ))}
          </select>
          <textarea
            className="input qr-textarea"
            value={config.content}
            spellCheck={false}
            onChange={(e) => updateConfig({ content: e.target.value })}
            placeholder="Enter content..."
          />
          <p className="help-text">{template.hint}</p>
        </div>

        {/* Appearance */}
        <div className="control-group">
          <label className="control-label">Appearance</label>
          <div className="color-palettes">
            {palettes.map((p) => (
              <button
                key={p.label}
                className="palette-btn"
                title={p.label}
                onClick={() => updateConfig({ fg: p.fg, bg: p.bg, transparentBg: false })}
              >
                <span className="palette-swatch" style={{ background: p.fg }} />
                <span className="palette-swatch" style={{ background: p.bg }} />
              </button>
            ))}
          </div>
          <div className="color-row">
            <ColorField label="Code" value={config.fg} onChange={(v) => updateConfig({ fg: v })} />
            <div className="color-divider" />
            <ColorField label="Background" value={config.bg} onChange={(v) => updateConfig({ bg: v })} />
          </div>

          <span className="qr-sub-label">Background</span>
          <div className="control-row">
            <label className="control-label">Transparent</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.transparentBg}
                onChange={(e) => updateConfig({ transparentBg: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <span className="qr-sub-label">Gradient</span>
          <div className="control-row">
            <label className="control-label">Enabled</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.gradient.enabled}
                onChange={(e) => updateConfig({ gradient: { ...config.gradient, enabled: e.target.checked } })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          {config.gradient.enabled && (
            <div className="qr-gradient-editor">
              <div className="color-row">
                <ColorField
                  label="From"
                  value={config.gradient.from}
                  onChange={(v) => updateConfig({ gradient: { ...config.gradient, from: v } })}
                />
                <div className="color-divider" />
                <ColorField
                  label="To"
                  value={config.gradient.to}
                  onChange={(v) => updateConfig({ gradient: { ...config.gradient, to: v } })}
                />
              </div>
              <div className="control-row">
                <label className="control-label">Direction</label>
                <select
                  className="preset-select"
                  value={config.gradient.type}
                  onChange={(e) =>
                    updateConfig({
                      gradient: { ...config.gradient, type: e.target.value as 'linear' | 'radial' },
                    })
                  }
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                </select>
              </div>
              {config.gradient.type === 'linear' && (
                <div className="range-group">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={5}
                    value={config.gradient.angle}
                    onChange={(e) => updateConfig({ gradient: { ...config.gradient, angle: Number(e.target.value) } })}
                  />
                  <span className="control-value">{config.gradient.angle}°</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Shape */}
        <div className="control-group">
          <label className="control-label">Shape</label>

          <span className="qr-sub-label">Dots</span>
          <div className="qr-style-grid qr-style-grid--4">
            {dotStyles.map((s) => (
              <button
                key={s}
                className={`qr-style-btn${config.dotStyle === s ? ' is-selected' : ''}`}
                onClick={() => updateConfig({ dotStyle: s })}
                title={dotLabels[s]}
              >
                <DotIcon style={s} />
                <span>{dotLabels[s]}</span>
              </button>
            ))}
          </div>

          <span className="qr-sub-label">Eyes</span>
          <div className="qr-style-grid qr-style-grid--3">
            {eyeStyles.map((s) => (
              <button
                key={s}
                className={`qr-style-btn${config.eyeStyle === s ? ' is-selected' : ''}`}
                onClick={() => updateConfig({ eyeStyle: s })}
                title={eyeLabels[s]}
              >
                <EyeIcon style={s} />
                <span>{eyeLabels[s]}</span>
              </button>
            ))}
          </div>

          <div className="control-row qr-block">
            <label className="control-label">Eye Color</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.useEyeColor}
                onChange={(e) => updateConfig({ useEyeColor: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          {config.useEyeColor && (
            <div className="qr-block">
              <ColorField label="Eyes" value={config.eyeColor} onChange={(v) => updateConfig({ eyeColor: v })} />
            </div>
          )}

          <div className="qr-block">
            <label className="control-label">
              Quiet Zone
              <span className="control-value">{config.quietZone}</span>
            </label>
            <div className="range-group">
              <input
                type="range"
                min={0}
                max={8}
                value={config.quietZone}
                onChange={(e) => updateConfig({ quietZone: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Advanced */}
        <div className="control-group">
          <label className="control-label clickable" onClick={() => setShowAdvanced((v) => !v)}>
            <span>Advanced</span>
            <Chevron open={showAdvanced} />
          </label>
          <div className={`collapsible-content${showAdvanced ? ' collapsible-content--open' : ''}`}>
            <div>
              <div className="control-row" style={{ marginTop: 14 }}>
                <label className="control-label">Error Correction</label>
                <select
                  className="preset-select"
                  value={config.ecc}
                  onChange={(e) => updateConfig({ ecc: e.target.value as Ecc })}
                >
                  {eccLevels.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="control-row">
                <label className="control-label">Export Size</label>
                <select
                  className="preset-select"
                  value={config.exportSize}
                  onChange={(e) => updateConfig({ exportSize: Number(e.target.value) })}
                >
                  {exportSizes.map((s) => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
              </div>

          <span className="qr-sub-label">Logo</span>
              {config.logo ? (
                <div className="qr-logo-row">
                  <img src={config.logo} alt="Logo" className="qr-logo-thumb" />
                  <button className="btn btn-xs" onClick={() => updateConfig({ logo: null })}>Remove</button>
                </div>
              ) : (
                <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
                  <ImageIcon size={14} />
                  Upload Logo
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleLogo(e.target.files?.[0])}
              />

              {config.logo && (
                <>
                  <div className="qr-block">
                    <label className="control-label">
                      Logo Size
                      <span className="control-value">{Math.round(config.logoSize * 100)}%</span>
                    </label>
                    <div className="range-group">
                      <input
                        type="range"
                        min={0.08}
                        max={0.5}
                        step={0.01}
                        value={config.logoSize}
                        onChange={(e) => updateConfig({ logoSize: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="control-row qr-block">
                    <label className="control-label">Clear Padding</label>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={config.logoPadding}
                        onChange={(e) => updateConfig({ logoPadding: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </>
              )}

              {matrix && (
                <div className="qr-meta">
                  <span>Version {matrix.version}</span>
                  <span className="qr-dot">/</span>
                  <span>{matrix.size}×{matrix.size}</span>
                  <span className="qr-dot">/</span>
                  <span>ECC {matrix.ecc}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="qr-warnings">
            {warnings.map((w) => (
              <p key={w} className="qr-warning">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {w}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="color-group">
      <span className="color-label">{label}</span>
      <div className="color-input-row">
        <input
          type="color"
          className="color-picker"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="input color-hex"
          value={value}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
