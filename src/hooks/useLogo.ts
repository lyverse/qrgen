import { useEffect, useState } from 'react'

export function useLogo(dataUrl: string | null): HTMLImageElement | null {
  const [logo, setLogo] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!dataUrl) {
      setLogo(null)
      return
    }
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setLogo(img)
    }
    img.onerror = () => {
      if (!cancelled) setLogo(null)
    }
    img.src = dataUrl
    return () => {
      cancelled = true
    }
  }, [dataUrl])

  return logo
}
