import type { ContentType } from '@/types'

export type ContentFieldKind =
  | 'text'
  | 'password'
  | 'tel'
  | 'email'
  | 'url'
  | 'textarea'
  | 'checkbox'
  | 'select'

export interface ContentField {
  key: string
  label: string
  placeholder?: string
  kind?: ContentFieldKind
  options?: string[]
  half?: boolean
}

export interface ContentTemplate {
  type: ContentType
  label: string
  hint: string
  value: string
  fields?: ContentField[]
}

export const wifiSecurity = ['WPA', 'WEP', 'None']

export const contentTemplates: ContentTemplate[] = [
  {
    type: 'text',
    label: 'Text',
    hint: 'Any plain text.',
    value: 'Hello from QRgen',
  },
  {
    type: 'url',
    label: 'Link',
    hint: 'A website or deep link.',
    value: 'https://example.com',
  },
  {
    type: 'wifi',
    label: 'Wi-Fi',
    hint: 'Join a Wi-Fi network.',
    value: 'WIFI:T:WPA;S:MyNetwork;P:my-password;;',
    fields: [
      { key: 'ssid', label: 'Network name', placeholder: 'MyNetwork' },
      { key: 'password', label: 'Password', kind: 'password', placeholder: '••••••••' },
      { key: 'encryption', label: 'Security', kind: 'select', options: wifiSecurity },
      { key: 'hidden', label: 'Hidden network', kind: 'checkbox' },
    ],
  },
  {
    type: 'email',
    label: 'Email',
    hint: 'Pre-fill an email draft.',
    value: 'mailto:hello@example.com?subject=Hi&body=Hello',
    fields: [
      { key: 'to', label: 'To', kind: 'email', placeholder: 'hello@example.com' },
      { key: 'subject', label: 'Subject', placeholder: 'Hi' },
      { key: 'body', label: 'Message', kind: 'textarea', placeholder: 'Hello' },
    ],
  },
  {
    type: 'phone',
    label: 'Phone',
    hint: 'Start a call. Format: tel:<number>',
    value: 'tel:+1234567890',
  },
  {
    type: 'sms',
    label: 'SMS',
    hint: 'Pre-fill a text message.',
    value: 'SMSTO:+1234567890:Hello',
    fields: [
      { key: 'number', label: 'Phone number', kind: 'tel', placeholder: '+1234567890' },
      { key: 'message', label: 'Message', kind: 'textarea', placeholder: 'Hello' },
    ],
  },
  {
    type: 'vcard',
    label: 'vCard',
    hint: 'Share a contact card.',
    value: [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Doe;Jane',
      'FN:Jane Doe',
      'ORG:Example Inc',
      'TEL:+1234567890',
      'EMAIL:jane@example.com',
      'URL:https://example.com',
      'END:VCARD',
    ].join('\n'),
    fields: [
      { key: 'firstName', label: 'First name', placeholder: 'Jane', half: true },
      { key: 'lastName', label: 'Last name', placeholder: 'Doe', half: true },
      { key: 'org', label: 'Organization', placeholder: 'Example Inc' },
      { key: 'phone', label: 'Phone', kind: 'tel', placeholder: '+1234567890' },
      { key: 'email', label: 'Email', kind: 'email', placeholder: 'jane@example.com' },
      { key: 'url', label: 'Website', kind: 'url', placeholder: 'https://example.com' },
    ],
  },
]

export function templateFor(type: ContentType): ContentTemplate {
  return contentTemplates.find((t) => t.type === type) ?? contentTemplates[0]
}

export function hasFields(type: ContentType): boolean {
  return (templateFor(type).fields?.length ?? 0) > 0
}

function emptyValues(fields: ContentField[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, '']))
}

/** Parse the raw content of a type into its editable field values. */
export function getFieldValues(type: ContentType, content: string): Record<string, string> {
  const fields = templateFor(type).fields ?? []
  if (fields.length === 0) return {}
  return { ...emptyValues(fields), ...parseByType(type, content) }
}

/** Encode editable field values back into the raw content string. */
export function buildContent(type: ContentType, values: Record<string, string>): string {
  switch (type) {
    case 'wifi':
      return buildWifi(values)
    case 'email':
      return buildEmail(values)
    case 'sms':
      return buildSms(values)
    case 'vcard':
      return buildVcard(values)
    default:
      return values.content ?? ''
  }
}

function splitEscaped(input: string, sep: string): string[] {
  const out: string[] = []
  let current = ''
  let escaped = false
  for (const ch of input) {
    if (escaped) {
      current += ch
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (ch === sep) {
      out.push(current)
      current = ''
      continue
    }
    current += ch
  }
  out.push(current)
  return out
}

const escapeWifi = (v: string) => v.replace(/([\\;,:"])/g, '\\$1')

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function parseByType(type: ContentType, content: string): Record<string, string> {
  switch (type) {
    case 'wifi':
      return parseWifi(content)
    case 'email':
      return parseEmail(content)
    case 'sms':
      return parseSms(content)
    case 'vcard':
      return parseVcard(content)
    default:
      return {}
  }
}

function parseWifi(content: string): Record<string, string> {
  const values: Record<string, string> = { ssid: '', password: '', encryption: 'WPA', hidden: '' }
  const body = content.replace(/^WIFI:/i, '')
  for (const segment of splitEscaped(body, ';')) {
    if (!segment) continue
    const idx = segment.indexOf(':')
    if (idx === -1) continue
    const key = segment.slice(0, idx).trim().toUpperCase()
    const raw = segment.slice(idx + 1)
    if (key === 'S') values.ssid = raw
    else if (key === 'P') values.password = raw
    else if (key === 'T') {
      const t = raw.toUpperCase()
      values.encryption = t === 'NOPASS' ? 'None' : t.startsWith('WEP') ? 'WEP' : 'WPA'
    } else if (key === 'H') {
      values.hidden = /^true$/i.test(raw) ? 'true' : ''
    }
  }
  return values
}

function buildWifi(values: Record<string, string>): string {
  const security = values.encryption === 'None' ? 'nopass' : values.encryption || 'WPA'
  let out = `WIFI:T:${security};`
  if (values.ssid) out += `S:${escapeWifi(values.ssid)};`
  if (values.password && security !== 'nopass') out += `P:${escapeWifi(values.password)};`
  if (values.hidden === 'true') out += 'H:true;'
  return `${out};`
}

function parseEmail(content: string): Record<string, string> {
  const values: Record<string, string> = { to: '', subject: '', body: '' }
  const rest = content.replace(/^mailto:/i, '')
  const queryAt = rest.indexOf('?')
  values.to = queryAt === -1 ? rest : rest.slice(0, queryAt)
  if (queryAt !== -1) {
    for (const pair of rest.slice(queryAt + 1).split('&')) {
      const eq = pair.indexOf('=')
      const key = (eq === -1 ? pair : pair.slice(0, eq)).toLowerCase()
      const raw = eq === -1 ? '' : pair.slice(eq + 1)
      if (key === 'subject') values.subject = safeDecode(raw)
      else if (key === 'body') values.body = safeDecode(raw)
    }
  }
  return values
}

function buildEmail(values: Record<string, string>): string {
  let out = `mailto:${values.to ?? ''}`
  const params: string[] = []
  if (values.subject) params.push(`subject=${encodeURIComponent(values.subject)}`)
  if (values.body) params.push(`body=${encodeURIComponent(values.body)}`)
  if (params.length) out += `?${params.join('&')}`
  return out
}

function parseSms(content: string): Record<string, string> {
  const body = content.replace(/^SMSTO:/i, '')
  const idx = body.indexOf(':')
  if (idx === -1) return { number: body, message: '' }
  return { number: body.slice(0, idx), message: body.slice(idx + 1) }
}

function buildSms(values: Record<string, string>): string {
  return `SMSTO:${values.number ?? ''}:${values.message ?? ''}`
}

function parseVcard(content: string): Record<string, string> {
  const values: Record<string, string> = {
    firstName: '',
    lastName: '',
    org: '',
    phone: '',
    email: '',
    url: '',
  }
  for (const line of content.split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim().toUpperCase()
    const raw = line.slice(idx + 1).trim()
    if (key === 'N') {
      const [last = '', first = ''] = raw.split(';')
      values.lastName = last
      values.firstName = first
    } else if (key === 'ORG') values.org = raw
    else if (key === 'TEL') values.phone = raw
    else if (key === 'EMAIL') values.email = raw
    else if (key === 'URL') values.url = raw
    else if (key === 'FN' && !values.firstName && !values.lastName) {
      const [first = '', ...rest] = raw.split(' ')
      values.firstName = first
      values.lastName = rest.join(' ')
    }
  }
  return values
}

function buildVcard(values: Record<string, string>): string {
  const first = values.firstName ?? ''
  const last = values.lastName ?? ''
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  if (first || last) lines.push(`N:${last};${first}`)
  const fullName = [values.firstName, values.lastName].filter(Boolean).join(' ')
  if (fullName) lines.push(`FN:${fullName}`)
  if (values.org) lines.push(`ORG:${values.org}`)
  if (values.phone) lines.push(`TEL:${values.phone}`)
  if (values.email) lines.push(`EMAIL:${values.email}`)
  if (values.url) lines.push(`URL:${values.url}`)
  lines.push('END:VCARD')
  return lines.join('\n')
}
