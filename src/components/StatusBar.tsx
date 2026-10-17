import { Github, Info, X } from 'lucide-react'
import { useState } from 'react'
import { WaveBackground } from './WaveBackground'

export function StatusBar() {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <footer className="statusbar">
      <span>QRgen &mdash; QR Code Generator</span>
      <span className="statusbar-right">
        <button className="info-btn" onClick={() => setShowInfo(true)} title="About">
          <span>2026</span>
          <Info size={14} />
        </button>
      </span>
      {showInfo && (
        <>
          <div className="info-backdrop" onClick={() => setShowInfo(false)} />
          <div className="info-modal">
            <WaveBackground light dim />
            <button className="info-close" onClick={() => setShowInfo(false)}>
              <X size={16} />
            </button>
            <div className="info-content">
              <h2>QRgen</h2>
              <p className="info-subtitle">QR Code Generator</p>
              <hr />
              <p>Everything runs locally in your browser. Your content and logos never leave your device.</p>
              <p>Built with React, TypeScript, Vite, and the QR Code library.</p>
              <hr />
              <p className="info-credits">
                <a
                  href="https://github.com/lyverse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="statusbar-link"
                >
                  <Github size={14} />
                  Lyverse
                </a>
              </p>
            </div>
          </div>
        </>
      )}
    </footer>
  )
}
