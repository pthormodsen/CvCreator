import { describe, expect, it } from 'vitest'
import { findFont, fontOptions, fontStack } from './fonts'

describe('fonter', () => {
  it('kjente navn gir listen med reserver, uten forskjell på store og små bokstaver', () => {
    expect(fontStack('Inter')).toBe('"Inter", system-ui, sans-serif')
    expect(fontStack('georgia')).toBe('Georgia, "Times New Roman", serif')
  })

  it('de fire fontene som følger med er merket som bundled', () => {
    const bundled = fontOptions.filter((f) => f.bundled).map((f) => f.name)
    expect(bundled).toEqual(['Inter', 'Source Serif 4', 'IBM Plex Sans', 'IBM Plex Mono'])
  })

  it('ukjente navn får anførselstegn og en reserve som ligner', () => {
    expect(fontStack('Lato')).toBe('"Lato", sans-serif')
    expect(fontStack('EB Garamond')).toBe('"EB Garamond", serif')
    expect(fontStack('Fira Code')).toBe('"Fira Code", monospace')
    expect(fontStack('Noto Sans Serif')).toBe('"Noto Sans Serif", sans-serif')
  })

  it('en liste med komma brukes som den er', () => {
    expect(fontStack('Lato, Arial, sans-serif')).toBe('Lato, Arial, sans-serif')
  })

  it('findFont finner bare kjente navn', () => {
    expect(findFont('ibm plex mono')?.bundled).toBe(true)
    expect(findFont('Comic Sans')).toBeUndefined()
  })
})
