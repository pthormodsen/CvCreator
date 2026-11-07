import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

// Gjør HTML-strengen om til elementer vi kan spørre i
function render(markdown: string): HTMLElement {
  const container = document.createElement('div')
  container.innerHTML = renderMarkdown(markdown)
  return container
}

describe('HTML blir renset (DOMPurify)', () => {
  it('fjerner onerror fra <img>', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('alert')
    // Selve bildet kan stå igjen, bare uten skriptet
    expect(render('<img src=x onerror="alert(1)">').querySelector('img')).not.toBeNull()
  })

  it('fjerner <script>', () => {
    const html = renderMarkdown('Hei\n\n<script>alert(1)</script>\n')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert')
  })

  it('fjerner hendelsesattributter lagt til med {…}-syntaksen', () => {
    const html = renderMarkdown('[Klikk](https://example.com){onclick="alert(1)"}')
    expect(html).not.toContain('onclick')
    expect(render('[Klikk](https://example.com){onclick="alert(1)"}').querySelector('a')?.getAttribute('href')).toBe(
      'https://example.com',
    )
  })

  it('fjerner javascript:-lenker', () => {
    const html = renderMarkdown('<a href="javascript:alert(1)">x</a>')
    expect(html).not.toContain('javascript:')
  })

  it('beholder vanlig markdown, klasser og Pandoc-blokker', () => {
    const cv = render('::: header\n# Ola\n:::\n\n### Rolle [2020]{.aside}\n\n**fet** og [lenke](https://example.com)')
    expect(cv.querySelector('div.header h1')?.textContent).toBe('Ola')
    expect(cv.querySelector('span.aside')?.textContent).toBe('2020')
    expect(cv.querySelector('strong')?.textContent).toBe('fet')
    expect(cv.querySelector('a')?.getAttribute('href')).toBe('https://example.com')
  })
})
