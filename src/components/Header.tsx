import { useStore } from '@/store/useStore'
import { RotateCcw, RotateCw, Save, Menu, Link2, Check } from 'lucide-react'
import { useState, useRef, useLayoutEffect } from 'react'
import { shareUrlForConfig } from '@/utils/share'

export function Header() {
  const [showMenu, setShowMenu] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null)
  const [shared, setShared] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const shareTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const resetConfig = useStore((s) => s.resetConfig)
  const savePreset = useStore((s) => s.savePreset)
  const presets = useStore((s) => s.presets)
  const loadPreset = useStore((s) => s.loadPreset)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const canUndo = useStore((s) => s.history.past.length > 0)
  const canRedo = useStore((s) => s.history.future.length > 0)

  useLayoutEffect(() => {
    if (!showMenu || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
      zIndex: 30,
    })
  }, [showMenu])

  const handleSavePreset = () => {
    if (!presetName.trim()) return
    savePreset(presetName.trim())
    setPresetName('')
    setShowSave(false)
  }

  const handleShare = () => {
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
    const url = shareUrlForConfig(useStore.getState().config)
    if (!navigator.clipboard) {
      setShared(true)
      shareTimerRef.current = setTimeout(() => setShared(false), 2000)
      return
    }
    navigator.clipboard.writeText(url).then(() => {
      setShared(true)
      shareTimerRef.current = setTimeout(() => setShared(false), 2000)
    })
  }

  return (
    <header className="header">
      <div className={`header-left${showSubtitle ? ' showing-subtitle' : ''}`} onClick={() => setShowSubtitle((v) => !v)}>
        <div className="logo">
          <span className="logo-icon">▚</span>
          <span className="logo-text">QRgen</span>
          <span className="logo-badge">Alpha 0.1</span>
        </div>
      </div>
      <div className={`header-center${showSubtitle ? ' visible' : ''}`}>
        <span className="header-subtitle">QR Code Generator</span>
      </div>
      <div className="header-right">
        <button ref={btnRef} className="header-menu-btn" onClick={() => setShowMenu((v) => !v)} title="Menu">
          <Menu size={20} />
        </button>
        {showMenu && menuStyle && (
          <>
            <div className="header-backdrop" onClick={() => setShowMenu(false)} />
            <div className="header-menu" style={menuStyle}>
              <div className="header-undo-row">
                <button
                  className="header-option"
                  onClick={() => { undo() }}
                  disabled={!canUndo}
                  title="Undo"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  className="header-option"
                  onClick={() => { redo() }}
                  disabled={!canRedo}
                  title="Redo"
                >
                  <RotateCw size={16} />
                </button>
              </div>
              <div className="header-menu-divider" />
              <button className="header-option" onClick={() => { resetConfig(); setShowMenu(false) }}>
                <RotateCcw size={16} />
                <div>
                  <strong>Reset</strong>
                  <span>Restore default options</span>
                </div>
              </button>
              <div className="header-menu-divider" />
              <div className="header-menu-section">
                <div className="header-menu-label">Presets</div>
                <button className="btn btn-sm header-menu-full" onClick={() => setShowPresets((v) => !v)}>
                  <span>Load Preset...</span>
                </button>
                {showPresets && (
                  <div className="header-menu-preset-list">
                    {presets.length === 0 ? (
                      <span className="header-menu-preset-empty">No saved presets</span>
                    ) : (
                      presets.map((p) => (
                        <button
                          key={p.id}
                          className="header-menu-preset-item"
                          onClick={() => { loadPreset(p); setShowMenu(false); setShowPresets(false) }}
                        >
                          {p.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
                <button className="btn btn-sm header-menu-full" onClick={() => setShowSave((v) => !v)}>
                  <Save size={14} />
                  <span>Save Preset</span>
                </button>
                {showSave && (
                  <div className="save-popup header-menu-save">
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Preset name..."
                      className="input"
                      onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                    />
                    <button className="btn btn-sm btn-primary" onClick={handleSavePreset}>Save</button>
                  </div>
                )}
                <button
                  className={`btn btn-sm header-menu-full${shared ? ' btn-copied' : ''}`}
                  onClick={handleShare}
                  title="Copy share link"
                >
                  {shared ? <Check size={14} /> : <Link2 size={14} />}
                  <span>{shared ? 'Copied!' : 'Share as Link'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
