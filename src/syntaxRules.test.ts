import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'
import { structureCv } from './structure'
import { syntaxRules } from './syntaxRules'
import { parseCv } from './settings'

// Hvert eksempel i jukselappen skal gi det jukselappen sier
describe('jukselappen stemmer med koden', () => {
  it.each(syntaxRules)('$title', (rule) => {
    const source = rule.afterName ? `# Ola Nordmann\n\n${rule.example}` : rule.example
    if (rule.settings) {
      // Front matter: gyldig, gir innstillinger, og ingenting av det havner i CV-en
      const cv = parseCv(`${source}\n# Ola\n`)
      expect(cv.warnings).toEqual([])
      expect(Object.keys(cv.settings).length).toBeGreaterThan(0)
      expect(renderMarkdown(`${source}\n# Ola\n`)).toBe('<h1>Ola</h1>\n')
      return
    }
    const container = document.createElement('div')
    container.innerHTML = structureCv(renderMarkdown(source), 'single')
    expect(container.querySelector(rule.selector!)).not.toBeNull()
  })
})
