import { describe, expect, it } from 'vitest'
import { modifiedFields } from './cvStyle'
import { parseCv } from './settings'
import { findTheme } from './themes'

const modified = (frontMatter: string, theme = 'classic') =>
  modifiedFields(findTheme(theme), parseCv(`---\n${frontMatter}\n---\n# Ola\n`).settings)

describe('modifiedFields', () => {
  it('ingen innstillinger: ingenting er endret', () => {
    expect(Object.values(modified('theme: classic')).some(Boolean)).toBe(false)
  })

  it('verdier lik themets standard regnes ikke som endret', () => {
    const m = modified(
      'accent: "#1F4E79"\nfont-size: 9.5pt\nline-height: 1.4\nmargins: 14mm 16mm\nlabels:\n  contact: Contact',
    )
    expect(Object.values(m).some(Boolean)).toBe(false)
  })

  it('samme lengde i en annen enhet er ikke endret', () => {
    expect(modified('margins: 1.4cm 1.6cm').margins).toBe(false)
  })

  it('verdier som avviker, er endret', () => {
    const m = modified('accent: "#ff0000"\nfont-size: 10pt\nlabels:\n  contact: Kontakt')
    expect(m).toMatchObject({ accent: true, fontSize: true, contact: true, lineHeight: false })
  })

  it('standarden avhenger av themet: 9pt er endret i Classic, men ikke i Modern', () => {
    expect(modified('font-size: 9pt', 'classic').fontSize).toBe(true)
    expect(modified('font-size: 9pt', 'modern').fontSize).toBe(false)
  })
})
