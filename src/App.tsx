import { useEffect } from 'react'
import { Header } from './components/Header'
import { QrPreview } from './components/QrPreview'
import { Controls } from './components/Controls'
import { ExportMenu } from './components/ExportMenu'
import { StatusBar } from './components/StatusBar'
import { useQrCode } from './hooks/useQrCode'
import { useStore } from './store/useStore'
import { readConfigFromHash } from './utils/share'

export default function App() {
  useQrCode()
  const sidebarOpen = useStore((s) => s.sidebarOpen)

  useEffect(() => {
    const cfg = readConfigFromHash()
    if (cfg) useStore.getState().setConfig(cfg)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) useStore.getState().redo()
        else useStore.getState().undo()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="preview-section">
          <QrPreview />
        </div>
        <aside className={`sidebar${sidebarOpen ? '' : ' sidebar--collapsed'}`}>
          <Controls />
          <div className="sidebar-actions">
            <ExportMenu />
          </div>
        </aside>
      </main>
      <StatusBar />
    </div>
  )
}
