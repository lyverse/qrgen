import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { buildMatrix } from '@/utils/qr'
import { qrPayload } from '@/utils/templates'

export function useQrCode(): void {
  const content = useStore((s) => s.config.content)
  const contentType = useStore((s) => s.config.contentType)
  const ecc = useStore((s) => s.config.ecc)
  const setMatrix = useStore((s) => s.setMatrix)
  const setError = useStore((s) => s.setError)

  useEffect(() => {
    const payload = qrPayload(contentType, content)
    if (!payload.trim()) {
      setMatrix(null)
      setError(null)
      return
    }
    try {
      const matrix = buildMatrix(payload, ecc)
      setMatrix(matrix)
      setError(null)
    } catch {
      setMatrix(null)
      setError('This content is too long to fit in a QR code at the selected error correction level.')
    }
  }, [content, contentType, ecc, setMatrix, setError])
}
