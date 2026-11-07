import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'
import { structureCv, type Layout } from './structure'
import defaultCv from './defaultCv.md?raw'
// Samme CV skrevet på to måter: vanlig markdown og Pandoc-syntaks
import plainCv from './__fixtures__/cv-plain.md?raw'
import pandocCv from './__fixtures__/cv-pandoc.md?raw'

// Kjør hele kjeden (markdown → HTML → struktur) og gi tilbake et element vi kan spørre i
function build(markdown: string, layout: Layout = 'single'): HTMLElement {
  const html = structureCv(renderMarkdown(markdown), layout)
  const container = document.createElement('div')
  container.innerHTML = html
  return container
}

const texts = (root: Element, selector: string) =>
  [...root.querySelectorAll(selector)].map((el) => el.textContent!.trim())

// En oppsummering av klassene themene bruker. To CV-er med samme innhold
// skal gi lik oppsummering, uansett om de er skrevet i vanlig markdown eller Pandoc.
function summarize(root: Element) {
  return {
    name: texts(root, '.header h1'),
    subtitle: texts(root, '.header .subtitle'),
    contactLinks: [...root.querySelectorAll('.header .contact a')].map((a) => a.getAttribute('href')),
    sections: texts(root, 'section > h2'),
    entries: texts(root, '.entry > h3').length,
    asides: texts(root, 'h3 .aside'),
    stacks: texts(root, 'p.stack'),
    terms: texts(root, 'dl > dt'),
    definitions: texts(root, 'dl > dd'),
  }
}

describe('vanlig markdown og Pandoc gir samme struktur', () => {
  it('for en hel CV (fixtures)', () => {
    const plain = summarize(build(plainCv))
    const pandoc = summarize(build(pandocCv))

    expect(plain).toEqual(pandoc)
    // Sjekk at oppsummeringen faktisk inneholder noe, så testen ikke passerer på to tomme
    expect(plain.name).toEqual(['Patrik Thormodsen'])
    expect(plain.contactLinks).toHaveLength(5)
    expect(plain.asides.length).toBeGreaterThan(5)
    expect(plain.stacks).toHaveLength(5)
    expect(plain.terms).toContain('Maskinlæring')
  })

  it('for et lite eksempel med alle elementene', () => {
    const plain = `
# Kari Nordmann

Utvikler

[kari@example.com](mailto:kari@example.com) · [github.com/kari](https://github.com/kari)

## Ferdigheter

- **Språk:** Java, Python
- **Verktøy:** Git

## Erfaring

### Utvikler, Firma AS | 2020 – nå

*React · TypeScript*

- Laget ting
`
    const pandoc = `
::: header
:::: identity
# Kari Nordmann

[Utvikler]{.subtitle}
::::

:::: contact
[kari@example.com](mailto:kari@example.com) · [github.com/kari](https://github.com/kari)
::::
:::

## Ferdigheter

Språk
: Java, Python

Verktøy
: Git

## Erfaring

### Utvikler, Firma AS [2020 – nå]{.aside}

[React · TypeScript]{.stack}

- Laget ting
`
    expect(summarize(build(plain))).toEqual(summarize(build(pandoc)))
  })
})

describe('lister med **Etikett:**', () => {
  it('blir <dl> når alle punktene har etikett', () => {
    const cv = build('## Ferdigheter\n\n- **Språk:** Java\n- **Verktøy:** Git\n')
    expect(cv.querySelector('ul')).toBeNull()
    expect(texts(cv, 'dt')).toEqual(['Språk', 'Verktøy'])
    expect(texts(cv, 'dd')).toEqual(['Java', 'Git'])
  })

  it('godtar kolon rett etter fet tekst: **Språk**: Java', () => {
    const cv = build('- **Språk**: Java\n- **Verktøy**: Git\n')
    expect(texts(cv, 'dt')).toEqual(['Språk', 'Verktøy'])
    expect(texts(cv, 'dd')).toEqual(['Java', 'Git'])
  })

  it('forblir en vanlig liste når bare noen punkter har etikett', () => {
    const cv = build('- **Språk:** Java\n- Git og GitHub\n- **Verktøy:** Docker\n')
    expect(cv.querySelector('dl')).toBeNull()
    expect(cv.querySelectorAll('ul > li')).toHaveLength(3)
    // Den fete teksten skal stå urørt
    expect(texts(cv, 'li strong')).toEqual(['Språk:', 'Verktøy:'])
  })

  it('forblir en vanlig liste når fet tekst mangler kolon', () => {
    const cv = build('- **Nestleder**, Fribyte\n- **Sekretær**, Root\n')
    expect(cv.querySelector('dl')).toBeNull()
    expect(cv.querySelectorAll('ul > li')).toHaveLength(2)
  })
})

describe('header', () => {
  it('fungerer uten kontaktlenker', () => {
    const cv = build('# Ola Nordmann\n\nStudent\n\n## Profil\n\nTekst om meg.\n')
    expect(texts(cv, '.header h1')).toEqual(['Ola Nordmann'])
    expect(texts(cv, '.header .subtitle')).toEqual(['Student'])
    expect(cv.querySelector('.contact')).toBeNull()
    // Avsnittet under ## Profil skal ikke dras opp i headeren
    expect(texts(cv, 'section > p')).toEqual(['Tekst om meg.'])
  })

  it('fungerer uten kontaktlenker i sidebar-layout', () => {
    const cv = build('# Ola Nordmann\n\n## Ferdigheter\n\n- **Språk:** Java\n', 'sidebar')
    expect(cv.querySelector('.contact')).toBeNull()
    expect(texts(cv, '.sidebar h2')).toEqual(['Ferdigheter'])
  })

  it('tolker avsnitt med lenker rett under navnet som kontaktinfo, ikke undertittel', () => {
    const cv = build('# Ola\n\n[ola@example.com](mailto:ola@example.com)\n')
    expect(cv.querySelector('.subtitle')).toBeNull()
    expect(texts(cv, '.contact a')).toEqual(['ola@example.com'])
  })

  it('henter ikke lenker fra seksjoner som kontaktinfo', () => {
    const cv = build('# Ola\n\n## Prosjekter\n\nSe [GitHub](https://github.com).\n')
    expect(cv.querySelector('.contact')).toBeNull()
  })

  it('lager ingen header når CV-en mangler #', () => {
    const cv = build('## Profil\n\nTekst.\n')
    expect(cv.querySelector('.header')).toBeNull()
    expect(texts(cv, 'section > h2')).toEqual(['Profil'])
  })

  it('pakker · i kontaktinfo inn i .sep', () => {
    const cv = build('# Ola\n\n[a](mailto:a@b.no) · [b](https://b.no)\n')
    expect(cv.querySelectorAll('.contact .sep')).toHaveLength(1)
  })
})

describe('### overskrifter', () => {
  it('uten dato får ingen .aside, men havner i en .entry', () => {
    const cv = build('## Erfaring\n\n### Homelab\n\n- Punkt\n')
    expect(cv.querySelector('.aside')).toBeNull()
    expect(texts(cv, '.entry > h3')).toEqual(['Homelab'])
    expect(cv.querySelectorAll('.entry li')).toHaveLength(1)
  })

  it('med | flytter alt etter streken, også lenker, inn i .aside', () => {
    const cv = build('### Chess | [Live](https://a.no) · [GitHub](https://b.no)\n')
    const h3 = cv.querySelector('h3')!
    expect(texts(cv, 'h3 .aside a')).toEqual(['Live', 'GitHub'])
    expect(h3.textContent).not.toContain('|')
    // Tittelen uten aside skal være bare "Chess"
    const title = h3.cloneNode(true) as Element
    title.querySelector('.aside')!.remove()
    expect(title.textContent!.trim()).toBe('Chess')
  })

  it('beholder | i datoen hvis det står flere', () => {
    const cv = build('### Rolle | 2020 | Bergen\n')
    expect(texts(cv, 'h3 .aside')).toEqual(['2020 | Bergen'])
  })
})

describe('teknologilinje (.stack)', () => {
  it('kursiv linje rett under ### blir .stack', () => {
    const cv = build('### Prosjekt\n\n*React · TS*\n\nBeskrivelse\n')
    expect(texts(cv, 'p.stack')).toEqual(['React · TS'])
  })

  it('kursiv linje andre steder blir ikke .stack', () => {
    const cv = build('## Profil\n\n*Kursiv tekst*\n')
    expect(cv.querySelector('.stack')).toBeNull()
  })

  it('avsnitt med kursiv og vanlig tekst blir ikke .stack', () => {
    const cv = build('### Prosjekt\n\n*React* og mer tekst\n')
    expect(cv.querySelector('.stack')).toBeNull()
  })
})

describe('layout', () => {
  it('single beholder rekkefølgen på seksjonene', () => {
    const cv = build(plainCv, 'single')
    expect(cv.querySelector('.sidebar')).toBeNull()
    expect(texts(cv, 'section > h2').slice(0, 3)).toEqual([
      'Profil',
      'Teknisk kompetanse',
      'Utvalgte prosjekter',
    ])
  })

  it('sidebar flytter kontakt og seksjoner med <dl> til sidekolonnen', () => {
    const cv = build(plainCv, 'sidebar')
    expect(cv.querySelector('.sidebar > .contact')).not.toBeNull()
    expect(cv.querySelector('.header .contact')).toBeNull()
    expect(texts(cv, '.sidebar section > h2')).toEqual(['Teknisk kompetanse', 'Språk'])
    expect(texts(cv, '.main section > h2')).not.toContain('Språk')
  })
})

// Standardteksten nye brukere ser: den skal vise frem alle reglene
describe('eksempelteksten (defaultCv.md)', () => {
  it('gir header, kontakt, datoer, teknologilinjer og ferdigheter', () => {
    const s = summarize(build(defaultCv))
    expect(s.name).toHaveLength(1)
    expect(s.subtitle).toHaveLength(1)
    expect(s.contactLinks.length).toBeGreaterThan(0)
    expect(s.asides.length).toBeGreaterThan(0)
    expect(s.stacks.length).toBeGreaterThan(0)
    expect(s.terms.length).toBeGreaterThan(0)
  })
})
