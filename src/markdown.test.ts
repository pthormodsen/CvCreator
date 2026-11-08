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

describe('eksterne bilder blokkeres, data:-bilder er lov', () => {
  const PIXEL = 'data:image/png;base64,iVBORw0KGgo='

  it('fjerner src på bilder fra nettet (markdown og HTML)', () => {
    expect(render('![Logo](https://evil.example/x.png)').querySelector('img')?.hasAttribute('src')).toBe(false)
    expect(render('<img src="//evil.example/x.png">').querySelector('img')?.hasAttribute('src')).toBe(false)
    expect(renderMarkdown('<img src="x.png" srcset="https://evil.example/x.png 2x">')).not.toContain('evil')
  })

  it('beholder data:image-bilder', () => {
    expect(render(`![Logo](${PIXEL})`).querySelector('img')?.getAttribute('src')).toBe(PIXEL)
  })

  it('fjerner url() fra nettet i style-attributter, men beholder data:', () => {
    expect(renderMarkdown('<div style="color: red; background: url(https://evil.example/x.png)">x</div>')).not.toContain('evil')
    expect(render('<div style="color: red; background: url(https://evil.example/x.png)">x</div>').querySelector('div')?.getAttribute('style')).toContain('color: red')
    expect(render(`<div style="background: url('${PIXEL}')">x</div>`).querySelector('div')?.getAttribute('style')).toContain(PIXEL)
  })

  it('fjerner style med triks som kan skjule url(', () => {
    for (const style of ['background: \\75rl(https://evil.example/x)', 'background: url(https://evil.example/x', 'background: image-set("https://evil.example/x" 1x)']) {
      expect(renderMarkdown(`<div style='${style}'>x</div>`)).not.toContain('evil')
    }
  })

  it('fjerner SVG, video og andre tagger som kan laste fra nettet', () => {
    const html = renderMarkdown(
      '<svg><image href="https://evil.example/a.png"/></svg><video poster="https://evil.example/b.png"></video><audio src="https://evil.example/c.mp3"></audio><table background="https://evil.example/d.png"><tr><td>x</td></tr></table>',
    )
    expect(html).not.toContain('evil')
  })
})
