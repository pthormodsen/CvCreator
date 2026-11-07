// Gjør "flat" HTML fra markdown-it om til en CV-struktur som themene kan style.
//
// Vanlig markdown tolkes slik:
//   # Navn                         → .header > .identity > h1
//   avsnitt rett under (uten lenker) → .subtitle
//   første avsnitt med lenker      → .header > .contact
//   ### Tittel | detalj            → h3 med <span class="aside">detalj</span>
//   *kursiv linje* rett under ###  → p.stack
//   - **Etikett:** verdi           → <dl><dt>Etikett</dt><dd>verdi</dd></dl>
//   ## Seksjon                     → <section>, og hver ### inni → <div class="entry">
//
// Pandoc-syntaks (::: header, {.aside}, {.stack}, definisjonslister) gir de samme
// klassene direkte, og da hopper vi over gjettingen.

export type Layout = 'single' | 'sidebar'

export type StructureOptions = {
  contactLabel?: string // overskriften over kontaktinfo i sidekolonnen
  sidebar?: string[] // ## seksjoner som skal i sidekolonnen. Tom: seksjoner med <dl>.
}

export function structureCv(html: string, layout: Layout, options: StructureOptions = {}): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const body = doc.body

  // 1. Små justeringer inne i innholdet
  splitHeadingAsides(doc)
  markStackLines(doc)
  keyValueListsToDl(doc)

  // 2. Hent ut toppen (navn, undertittel, kontakt)
  const header = extractHeader(doc)
  const contact = header?.querySelector('.contact')
  if (contact) markSeparators(doc, contact)

  // 3. Del resten inn i seksjoner
  const { intro, sections } = groupSections(doc, [...body.children])
  sections.forEach((section) => groupEntries(doc, section))

  // 4. Sett sammen etter layouten themet ønsker
  const cv = createEl(doc, 'div', 'cv')
  if (header) cv.append(header)

  if (layout === 'single') {
    cv.append(...intro, ...sections)
  } else {
    const sidebar = createEl(doc, 'aside', 'sidebar')
    const main = createEl(doc, 'div', 'main')
    if (contact) {
      // En ekte overskrift (ikke CSS content), så den blir med når PDF-en leses som tekst
      const title = createEl(doc, 'h2', 'contact-title')
      title.textContent = options.contactLabel ?? 'Contact'
      contact.prepend(title)
      sidebar.append(contact)
    }
    main.append(...intro)
    sections.forEach((s) => (belongsInSidebar(s, options.sidebar) ? sidebar : main).append(s))
    const columns = createEl(doc, 'div', 'columns')
    columns.append(sidebar, main)
    cv.append(columns)
  }

  return cv.outerHTML
}

// Valgt i front matter (sidebar: [Skills, Languages]), ellers: seksjoner med en <dl>
// (ferdigheter, språk o.l.). Navnene sammenlignes uten forskjell på store og små bokstaver.
function belongsInSidebar(section: HTMLElement, chosen?: string[]): boolean {
  if (!chosen?.length) return section.querySelector('dl') !== null
  const heading = section.querySelector('h2')?.textContent?.trim().toLowerCase() ?? ''
  return chosen.some((name) => name.trim().toLowerCase() === heading)
}

function createEl(doc: Document, tag: string, className: string): HTMLElement {
  const el = doc.createElement(tag)
  el.className = className
  return el
}

// Barn-noder uten tomme tekstnoder (linjeskift mellom tagger)
function meaningfulChildren(el: Element): ChildNode[] {
  return [...el.childNodes].filter((n) => n.nodeType !== Node.TEXT_NODE || n.textContent!.trim())
}

// "### Chess | [Live](...)" → alt etter | havner i <span class="aside">
function splitHeadingAsides(doc: Document) {
  for (const h3 of doc.querySelectorAll('h3')) {
    if (h3.querySelector('.aside')) continue // Pandoc-varianten

    const pipe = [...h3.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent!.includes('|'),
    )
    if (!pipe) continue

    const [before, ...after] = pipe.textContent!.split('|')
    const aside = createEl(doc, 'span', 'aside')
    const afterText = after.join('|').trim()
    if (afterText) aside.append(afterText)
    // Flytt alle nodene etter |-teksten (f.eks. lenker) inn i aside
    while (pipe.nextSibling) aside.append(pipe.nextSibling)
    pipe.textContent = before.trimEnd()
    h3.append(' ', aside)
  }
}

// Avsnitt rett under ### som bare består av kursiv tekst (eller Pandoc-span .stack)
function markStackLines(doc: Document) {
  for (const p of doc.querySelectorAll('h3 + p')) {
    const children = meaningfulChildren(p)
    const only = children.length === 1 ? children[0] : null
    if (only instanceof Element && (only.tagName === 'EM' || only.classList.contains('stack'))) {
      p.classList.add('stack')
    }
  }
}

// En liste der hvert punkt starter med **Etikett:** blir en definisjonsliste
function keyValueListsToDl(doc: Document) {
  for (const ul of doc.querySelectorAll('ul')) {
    const items = [...ul.children]
    const isKeyValue =
      items.length > 0 &&
      items.every((li) => {
        const [first, second] = meaningfulChildren(li)
        if (!(first instanceof Element) || first.tagName !== 'STRONG') return false
        // Kolonet kan stå inni (**Språk:**) eller rett etter (**Språk**:)
        return first.textContent!.trim().endsWith(':') || !!second?.textContent?.trimStart().startsWith(':')
      })
    if (!isKeyValue) continue

    const dl = doc.createElement('dl')
    for (const li of items) {
      const strong = li.querySelector('strong')!
      const dt = doc.createElement('dt')
      dt.textContent = strong.textContent!.trim().replace(/:$/, '')
      strong.remove()

      const dd = doc.createElement('dd')
      dd.append(...li.childNodes)
      const firstText = dd.firstChild
      if (firstText?.nodeType === Node.TEXT_NODE) {
        firstText.textContent = firstText.textContent!.replace(/^\s*:?\s*/, '')
      }
      dl.append(dt, dd)
    }
    ul.replaceWith(dl)
  }
}

function extractHeader(doc: Document): Element | null {
  const body = doc.body

  // Pandoc: ::: header finnes allerede
  const existing = body.querySelector(':scope > .header')
  if (existing) {
    existing.remove()
    return existing
  }

  const h1 = body.querySelector(':scope > h1')
  if (!h1) return null

  const header = createEl(doc, 'header', 'header')
  const identity = createEl(doc, 'div', 'identity')
  header.append(identity)

  // Avsnittet rett under navnet er undertittel, hvis det ikke har lenker
  const next = h1.nextElementSibling
  identity.append(h1)
  if (next?.tagName === 'P' && !next.querySelector('a')) {
    next.classList.add('subtitle')
    identity.append(next)
  }

  // Første avsnitt med lenker før første ## er kontaktinfo
  for (const el of [...body.children]) {
    if (el.tagName === 'H2') break
    if (el.tagName === 'P' && el.querySelector('a')) {
      const contact = createEl(doc, 'div', 'contact')
      contact.append(el)
      header.append(contact)
      break
    }
  }
  return header
}

// Pakk "·" i kontaktinfo inn i <span class="sep">, så et theme kan skjule dem
function markSeparators(doc: Document, root: Element) {
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const texts: Text[] = []
  while (walker.nextNode()) texts.push(walker.currentNode as Text)

  for (const text of texts) {
    if (!text.data.includes('·')) continue
    const parts = text.data.split('·')
    const fragment = doc.createDocumentFragment()
    parts.forEach((part, i) => {
      if (i > 0) {
        const sep = createEl(doc, 'span', 'sep')
        sep.textContent = '·'
        fragment.append(sep)
      }
      if (part) fragment.append(part)
    })
    text.replaceWith(fragment)
  }
}

// Alt fra en ## til neste ## blir én <section>. Det som står før første ## er "intro".
function groupSections(doc: Document, elements: Element[]) {
  const intro: Element[] = []
  const sections: HTMLElement[] = []
  let current: HTMLElement | null = null

  for (const el of elements) {
    if (el.tagName === 'H2') {
      current = doc.createElement('section')
      sections.push(current)
    }
    if (current) current.append(el)
    else intro.push(el)
  }
  return { intro, sections }
}

// Inni en seksjon: alt fra en ### til neste ### blir en .entry (holdes samlet ved sideskift)
function groupEntries(doc: Document, section: HTMLElement) {
  let current: HTMLElement | null = null
  for (const el of [...section.children]) {
    if (el.tagName === 'H3') {
      current = createEl(doc, 'div', 'entry')
      el.before(current)
    }
    if (current) current.append(el)
  }
}
