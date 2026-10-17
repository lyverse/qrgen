export type Ecc = 'L' | 'M' | 'Q' | 'H'

export type DotStyle = 'square' | 'rounded' | 'dots' | 'diamond'

export type EyeStyle = 'square' | 'rounded' | 'circle'

export type GradientType = 'linear' | 'radial'

export type ContentType = 'text' | 'url' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard'

export interface GradientConfig {
  enabled: boolean
  type: 'linear' | 'radial'
  from: string
  to: string
  angle: number
}

export interface QrConfig {
  contentType: ContentType
  content: string
  ecc: Ecc
  quietZone: number
  fg: string
  bg: string
  transparentBg: boolean
  gradient: {
    enabled: boolean
    type: 'linear' | 'radial'
    from: string
    to: string
    angle: number
  }
  dotStyle: DotStyle
  eyeStyle: EyeStyle
  useEyeColor: boolean
  eyeColor: string
  logo: string | null
  logoSize: number
  logoPadding: boolean
  exportSize: number
}

export interface Preset {
  id: string
  name: string
  config: QrConfig
}
