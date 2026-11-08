import { describe, expect, it } from 'vitest'
import { exampleCv } from './example'
import { parseCv } from './settings'
import defaultCv from './defaultCv.md?raw'

describe('exampleCv', () => {
  it('beholder valgt theme', () => {
    expect(parseCv(exampleCv('modern')).settings.theme).toBe('modern')
    expect(parseCv(exampleCv('minimal')).settings.theme).toBe('minimal')
  })

  it('endrer bare theme-linjen, kommentarer og resten beholdes', () => {
    expect(exampleCv('classic')).toBe(defaultCv)
    expect(exampleCv('modern')).toBe(defaultCv.replace('theme: classic', 'theme: modern'))
  })
})
