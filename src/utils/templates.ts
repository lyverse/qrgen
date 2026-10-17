import type { ContentType } from '@/types'

export interface ContentTemplate {
  type: ContentType
  label: string
  hint: string
  value: string
}

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
    hint: 'Join a network. Format: WIFI:T:<WPA|WEP|nopass>;S:<ssid>;P:<password>;H:<true|false>;;',
    value: 'WIFI:T:WPA;S:MyNetwork;P:my-password;H:false;;',
  },
  {
    type: 'email',
    label: 'Email',
    hint: 'Compose a message. Format: mailto:<to>?subject=<subject>&body=<body>',
    value: 'mailto:hello@example.com?subject=Hi&body=Hello',
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
    hint: 'Send a text. Format: SMSTO:<number>:<message>',
    value: 'SMSTO:+1234567890:Hello',
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
  },
]

export function templateFor(type: ContentType): ContentTemplate {
  return contentTemplates.find((t) => t.type === type) ?? contentTemplates[0]
}
