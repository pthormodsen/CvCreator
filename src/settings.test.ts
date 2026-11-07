import { describe, expect, it } from 'vitest'
import { parseCv, parseLength, sanitizeCss, settingDocs, splitFrontMatter, updateFrontMatter } from './settings'
import { renderMarkdown } from './markdown'
import { structureCv } from './structure'

const cvBody = '# Ola Nordmann\n\nUtvikler\n'

describe('front matter finnes eller ikke', () => {
  it('CV uten front matter er uendret og gir ingen innstillinger', () => {
    const cv = parseCv(cvBody)
    expect(cv.body).toBe(cvBody)
    expect(cv.frontMatter).toBeNull()
    expect(cv.settings).toEqual({})
    expect(cv.warnings).toEqual([])
  })

  it('leser front matter og gir resten som body', () => {
    const cv = parseCv(`---\ntheme: modern\n---\n${cvBody}`)
    expect(cv.settings.theme).toBe('modern')
    expect(cv.body).toBe(cvBody)
  })

  it('godtar tom front matter', () => {
    expect(splitFrontMatter(`---\n---\n${cvBody}`).body).toBe(cvBody)
  })

  it('--- uten avslutning er ikke front matter', () => {
    const source = `---\ntheme: modern\n${cvBody}`
    expect(parseCv(source).body).toBe(source)
  })

  it('--- som ikke står helt først er ikke front matter', () => {
    const source = `# Ola\n\n---\ntheme: modern\n---\n`
    expect(parseCv(source).frontMatter).toBeNull()
  })

  it('front matter vises aldri i CV-en', () => {
    const html = renderMarkdown(`---\ntheme: modern\naccent: "#ff0000"\n---\n${cvBody}`)
    expect(html).not.toContain('theme')
    expect(html).not.toContain('accent')
    expect(html).not.toContain('<hr')
    expect(html).toContain('<h1>Ola Nordmann</h1>')
  })
})

describe('gyldige verdier', () => {
  it('leser alle innstillingene', () => {
    const cv = parseCv(`---
theme: minimal
accent: "#0f766e"
font: Inter
font-size: 10pt
line-height: 1.5
margins: 12mm 15mm
section-gap: 4mm
entry-gap: 2.5mm
sidebar: [Skills, Languages]
labels:
  contact: Kontakt
filename: CV Ola
css: ".header h1 { letter-spacing: 0 }"
---
${cvBody}`)
    expect(cv.warnings).toEqual([])
    expect(cv.settings).toMatchObject({
      theme: 'minimal',
      accent: '#0f766e',
      font: 'Inter',
      fontSize: 10,
      lineHeight: 1.5,
      margins: { y: 12, x: 15 },
      sectionGap: 4,
      entryGap: 2.5,
      sidebar: ['Skills', 'Languages'],
      labels: { contact: 'Kontakt' },
      filename: 'CV Ola',
    })
    expect(cv.settings.css).toContain('.header h1')
  })

  it('regner om enheter', () => {
    expect(parseLength('12px', 'pt', 'pt')).toBeCloseTo(9)
    expect(parseLength('1cm', 'mm', 'mm')).toBeCloseTo(10)
    expect(parseLength(4, 'mm', 'mm')).toBe(4)
    const cv = parseCv('---\nmargins: 15\nfont-size: 9.5\n---\n')
    expect(cv.settings.margins).toEqual({ y: 15, x: 15 })
    expect(cv.settings.fontSize).toBe(9.5)
  })

  it('hvert eksempel i dokumentasjonen er gyldig', () => {
    for (const doc of settingDocs) {
      const cv = parseCv(`---\n${doc.key}: ${doc.example}\n---\n`)
      expect(cv.warnings, doc.key).toEqual([])
    }
  })
})

describe('ugyldige verdier gir advarsel, ikke krasj', () => {
  it.each([
    ['theme: fancy', 'theme'],
    ['accent: notacolor', 'accent'],
    ['font: "Comic; } body {"', 'font'],
    ['font-size: huge', 'font-size'],
    ['font-size: 40pt', 'font-size'],
    ['line-height: 7', 'line-height'],
    ['margins: 5mm 6mm 7mm', 'margins'],
    ['section-gap: -2mm', 'section-gap'],
    ['sidebar: 5', 'sidebar'],
    ['labels:\n  footer: x', 'labels'],
    ['colour: red', 'Unknown setting'],
  ])('%s', (yaml, expected) => {
    const cv = parseCv(`---\n${yaml}\n---\n${cvBody}`)
    expect(cv.warnings.join(' ')).toContain(expected)
    expect(cv.body).toBe(cvBody)
  })

  it('YAML med syntaksfeil gir advarsel og holdes fortsatt utenfor CV-en', () => {
    const cv = parseCv(`---\ntheme: [modern\n---\n${cvBody}`)
    expect(cv.warnings[0]).toContain('could not be read')
    expect(cv.yamlOk).toBe(false)
    expect(cv.body).toBe(cvBody)
  })

  it('gyldige verdier brukes selv om andre er ugyldige', () => {
    const cv = parseCv('---\ntheme: modern\naccent: nope\n---\n')
    expect(cv.settings.theme).toBe('modern')
    expect(cv.settings.accent).toBeUndefined()
    expect(cv.warnings).toHaveLength(1)
  })
})

describe('egen CSS', () => {
  it('låses til .cv-page', () => {
    expect(sanitizeCss('h1 { color: red }').css).toBe('.cv-page {\nh1 { color: red }\n}')
  })

  it('fjerner @import', () => {
    const { css, warnings } = sanitizeCss('@import url("https://evil.example/x.css");\nh1 { color: red }')
    expect(css).not.toContain('@import')
    expect(css).not.toContain('evil')
    expect(warnings.join(' ')).toContain('@import')
  })

  it('fjerner url() til eksterne adresser, men beholder data:', () => {
    const { css } = sanitizeCss(
      'h1 { background: url(https://tracker.example/p.png) } h2 { background: url(//x.example/a) } h3 { background: url("data:image/png;base64,AAAA") }',
    )
    expect(css).not.toContain('tracker')
    expect(css).not.toContain('x.example')
    expect(css).toContain('data:image/png')
  })

  it('ignorerer CSS med ubalanserte klammer, som kunne rømt ut av .cv-page', () => {
    const { css, warnings } = sanitizeCss('} body { display: none } .x {')
    expect(css).toBe('')
    expect(warnings.join(' ')).toContain('braces')
  })

  it('kan ikke avslutte <style>-taggen', () => {
    expect(sanitizeCss('h1 { color: red } </style><script>x</script>').css).not.toContain('</')
  })
})

describe('skrive til front matter', () => {
  it('lager front matter i en CV som ikke har det', () => {
    expect(updateFrontMatter(cvBody, ['theme'], 'modern')).toBe(`---\ntheme: modern\n---\n${cvBody}`)
  })

  it('endrer én verdi og beholder kommentarer, rekkefølge og resten av teksten', () => {
    const source = `---\n# Mine innstillinger\n\ntheme: modern # favoritten\naccent: "#0f766e"\n---\n${cvBody}`
    const result = updateFrontMatter(source, ['accent'], '#ff0000')
    expect(result).toBe(`---\n# Mine innstillinger\n\ntheme: modern # favoritten\naccent: "#ff0000"\n---\n${cvBody}`)
  })

  it('lager nøstede verdier (labels.contact)', () => {
    const result = updateFrontMatter(cvBody, ['labels', 'contact'], 'Kontakt')
    expect(parseCv(result).settings.labels?.contact).toBe('Kontakt')
  })

  it('fjerner tomme grupper og hele blokken når siste verdi fjernes', () => {
    const withLabel = updateFrontMatter(cvBody, ['labels', 'contact'], 'Kontakt')
    expect(updateFrontMatter(withLabel, ['labels', 'contact'], undefined)).toBe(cvBody)
  })

  it('rører ikke front matter med syntaksfeil', () => {
    const source = `---\ntheme: [modern\n---\n${cvBody}`
    expect(updateFrontMatter(source, ['accent'], '#ff0000')).toBe(source)
  })
})

describe('innstillinger i strukturen', () => {
  const md = `# Ola\n\n[ola@example.com](mailto:ola@example.com)\n\n## Profil\n\nTekst\n\n## Ferdigheter\n\n- **Språk:** Java\n\n## Prosjekter\n\n### X\n`

  it('kontaktoverskriften i sidekolonnen er en ekte <h2> med valgt tekst', () => {
    const container = document.createElement('div')
    container.innerHTML = structureCv(renderMarkdown(md), 'sidebar', { contactLabel: 'Kontakt' })
    expect(container.querySelector('.sidebar .contact h2.contact-title')?.textContent).toBe('Kontakt')
  })

  it('standard kontaktoverskrift er Contact', () => {
    const container = document.createElement('div')
    container.innerHTML = structureCv(renderMarkdown(md), 'sidebar')
    expect(container.querySelector('.contact-title')?.textContent).toBe('Contact')
  })

  it('sidebar i front matter velger seksjonene (uten forskjell på store og små bokstaver)', () => {
    const container = document.createElement('div')
    container.innerHTML = structureCv(renderMarkdown(md), 'sidebar', { sidebar: ['profil', 'Prosjekter'] })
    const inSidebar = [...container.querySelectorAll('.sidebar section > h2')].map((h) => h.textContent)
    expect(inSidebar).toEqual(['Profil', 'Prosjekter'])
    expect(container.querySelector('.main section > h2')?.textContent).toBe('Ferdigheter')
  })
})
