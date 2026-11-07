import { describe, expect, it } from 'vitest'
import { minimalChange, type TextChange } from './textDiff'

const apply = (text: string, c: TextChange | null) => (c ? text.slice(0, c.from) + c.insert + text.slice(c.to) : text)

describe('minimalChange', () => {
  it('gir null når teksten er lik', () => {
    expect(minimalChange('abc', 'abc')).toBeNull()
  })

  it('finner bare den endrede verdien i front matter', () => {
    const before = '---\naccent: "#111111"\n---\n# Ola\n'
    const after = '---\naccent: "#222222"\n---\n# Ola\n'
    const change = minimalChange(before, after)!
    expect(change.insert).toBe('222222')
    expect(apply(before, change)).toBe(after)
  })

  it('takler innsetting, sletting og helt ny tekst', () => {
    for (const [a, b] of [
      ['# Ola\n', '---\ntheme: modern\n---\n# Ola\n'],
      ['---\ntheme: modern\n---\n# Ola\n', '# Ola\n'],
      ['aaa', 'bbbb'],
      ['', 'x'],
      ['x', ''],
      ['aXa', 'aa'],
    ]) {
      expect(apply(a, minimalChange(a, b))).toBe(b)
    }
  })
})
