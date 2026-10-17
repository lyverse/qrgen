import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { buildMatrix } from '@/utils/qr'

export function useQrCode(): void {
  const content = useStore((s) => s.config.content)
  const ecc = useStore((s) => s.config.ecc)
  const setMatrix = useStore((s) => s.setMatrix)
  const setError = useStore((s) => s.setError)

  useEffect(() => {
    if (!content.trim()) {
      setMatrix(null)
      setError(null)
      return
    }
    try {
      const matrix = buildMatrix(content, ecc)
      setMatrix(matrix)
      setError(null)
    } catch {
      setMatrix(null)
      setError('This content is too long to fit in a QR code at the selected error correction level.')
    }
  }, [content, ecc, setMatrix, setError])
}
