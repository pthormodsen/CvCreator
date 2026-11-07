import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'
import { structureCv } from './structure'
import { syntaxRules } from './syntaxRules'

// Hvert eksempel i jukselappen skal gi det jukselappen sier
describe('jukselappen stemmer med koden', () => {
  it.each(syntaxRules)('$title', (rule) => {
    const source = rule.afterName ? `# Ola Nordmann\n\n${rule.example}` : rule.example
    const container = document.createElement('div')
    container.innerHTML = structureCv(renderMarkdown(source), 'single')
    expect(container.querySelector(rule.selector)).not.toBeNull()
  })
})
