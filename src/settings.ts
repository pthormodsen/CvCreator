// Innstillinger i YAML front matter øverst i CV-en:
//
//   ---
//   theme: modern
//   accent: "#0f766e"
//   font-size: 9.5pt
//   ---
//   # Navn …
//
// Front matter vises aldri i CV-en. Hver verdi valideres: en ugyldig verdi gir en advarsel
// og ignoreres (themets standard brukes), så CV-en aldri går i stykker.

import { isMap, parseDocument, Document } from 'yaml'
import { themes } from './themes'

export type Settings = {
  theme?: string
  accent?: string
  font?: string
  fontSize?: number // pt
  lineHeight?: number
  margins?: { y: number; x: number } // mm
  sectionGap?: number // mm
  entryGap?: number // mm
  sidebar?: string[]
  labels?: { contact?: string }
  filename?: string
  css?: string // allerede renset og låst til .cv-page
}

export type ParsedCv = {
  settings: Settings
  warnings: string[]
  body: string // markdown uten front matter
  frontMatter: string | null // YAML-teksten mellom ---, eller null
  yamlOk: boolean // false hvis YAML-en ikke kunne leses (da kan ikke panelet skrive til den)
}

// Dokumentasjon av hver nøkkel. Brukes i jukselappen, og testen sjekker at
// hvert eksempel faktisk er gyldig.
export const settingDocs: { key: string; example: string; description: string }[] = [
  { key: 'theme', example: 'modern', description: `${themes.map((t) => t.id).join(', ')}` },
  { key: 'accent', example: '"#0f766e"', description: 'Accent color (hex, rgb() or a color name)' },
  { key: 'font', example: 'Inter', description: 'A bundled font, a system font or any installed font name' },
  { key: 'font-size', example: '9.5pt', description: 'Body text size. Headings scale with it' },
  { key: 'line-height', example: '1.4', description: 'Line spacing' },
  { key: 'margins', example: '14mm 16mm', description: 'Top/bottom and sides (one value for all)' },
  { key: 'section-gap', example: '4mm', description: 'Space above each ## section' },
  { key: 'entry-gap', example: '2.5mm', description: 'Space above each ### entry' },
  { key: 'sidebar', example: '[Skills, Languages]', description: 'Sections in the sidebar (Modern)' },
  { key: 'labels', example: '{ contact: Kontakt }', description: 'Texts in the CV, e.g. the contact heading' },
  { key: 'filename', example: 'CV Alex Morgan', description: 'File name for the PDF and the .md file' },
  { key: 'css', example: '".header h1 { letter-spacing: 0 }"', description: 'Your own CSS (advanced)' },
]

// ---------- Finne front matter ----------

// Front matter må stå helt først: "---", YAML-linjer, "---". Uten avsluttende --- er det
// ikke front matter (da er det bare en vanlig skillelinje i markdown).
const FRONT_MATTER = /^---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/

export function splitFrontMatter(source: string): { frontMatter: string | null; body: string } {
  const match = source.match(FRONT_MATTER)
  if (!match) return { frontMatter: null, body: source }
  return { frontMatter: match[1] ?? '', body: source.slice(match[0].length) }
}

// ---------- Lese og validere ----------

export function parseCv(source: string): ParsedCv {
  const { frontMatter, body } = splitFrontMatter(source)
  const result: ParsedCv = { settings: {}, warnings: [], body, frontMatter, yamlOk: true }
  if (frontMatter === null || frontMatter.trim() === '') return result

  const doc = parseDocument(frontMatter)
  if (doc.errors.length > 0) {
    const first = doc.errors[0]
    const line = first.linePos?.[0].line
    result.warnings.push(`Settings could not be read${line ? ` (line ${line + 1})` : ''}: ${first.message.split('\n')[0]}`)
    result.yamlOk = false
    return result
  }
  const data = doc.toJS() as unknown
  if (data === null || data === undefined) return result
  if (typeof data !== 'object' || Array.isArray(data)) {
    result.warnings.push('Settings must be written as "key: value" lines.')
    result.yamlOk = false
    return result
  }

  const warn = (message: string) => result.warnings.push(message)
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    readSetting(key, value, result.settings, warn)
  }
  return result
}

function readSetting(key: string, value: unknown, s: Settings, warn: (m: string) => void) {
  const text = value === null || value === undefined ? '' : String(value).trim()
  switch (key) {
    case 'theme':
      if (themes.some((t) => t.id === text)) s.theme = text
      else warn(`theme: "${text}" is not a theme. Use ${themes.map((t) => t.id).join(', ')}.`)
      return
    case 'accent':
      if (isColor(text)) s.accent = text
      else warn(`accent: "${text}" is not a color. Use for example "#1f4e79".`)
      return
    case 'font':
      if (/^[\p{L}\p{N} \-'".,]{1,100}$/u.test(text)) s.font = text
      else warn(`font: "${text}" is not a valid font name.`)
      return
    case 'font-size': {
      const pt = parseLength(value, 'pt', 'pt')
      if (pt !== null && pt >= 6 && pt <= 16) s.fontSize = pt
      else warn(`font-size: "${text}" must be between 6pt and 16pt.`)
      return
    }
    case 'line-height': {
      const n = Number(text)
      if (text !== '' && Number.isFinite(n) && n >= 0.9 && n <= 2.5) s.lineHeight = n
      else warn(`line-height: "${text}" must be a number between 0.9 and 2.5.`)
      return
    }
    case 'margins': {
      const parts = text.split(/\s+/).map((p) => parseLength(p, 'mm', 'mm'))
      const valid = parts.length >= 1 && parts.length <= 2 && parts.every((p) => p !== null && p >= 0 && p <= 50)
      if (valid) s.margins = { y: parts[0]!, x: parts[1] ?? parts[0]! }
      else warn(`margins: "${text}" must be one or two lengths between 0 and 50mm, e.g. "14mm 16mm".`)
      return
    }
    case 'section-gap':
    case 'entry-gap': {
      const mm = parseLength(value, 'mm', 'mm')
      if (mm !== null && mm >= 0 && mm <= 30) s[key === 'section-gap' ? 'sectionGap' : 'entryGap'] = mm
      else warn(`${key}: "${text}" must be a length between 0 and 30mm.`)
      return
    }
    case 'sidebar': {
      const list = Array.isArray(value) ? value : [value]
      if (list.every((item) => typeof item === 'string' && item.trim() !== '')) {
        s.sidebar = list.map((item) => (item as string).trim())
      } else warn('sidebar: must be a list of section names, e.g. [Skills, Languages].')
      return
    }
    case 'labels': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        warn('labels: must be a list of "name: text", e.g. contact: Kontakt.')
        return
      }
      for (const [label, labelValue] of Object.entries(value)) {
        if (label !== 'contact') warn(`labels: unknown label "${label}". Available: contact.`)
        else if (typeof labelValue === 'string' && labelValue.trim().length <= 60) {
          s.labels = { ...s.labels, contact: labelValue.trim() }
        } else warn('labels.contact: must be a short text.')
      }
      return
    }
    case 'filename': {
      // Fjern tegn som ikke er lov i filnavn
      const clean = text.replace(/[/\\:*?"<>|\p{Cc}]/gu, '').trim().slice(0, 100)
      if (clean) s.filename = clean
      else warn('filename: must be a text.')
      return
    }
    case 'css': {
      const { css, warnings } = sanitizeCss(text)
      warnings.forEach(warn)
      if (css) s.css = css
      return
    }
    default:
      warn(`Unknown setting "${key}". Open Syntax to see the available settings.`)
  }
}

// ---------- Hjelpere ----------

const MM_PER: Record<string, number> = { mm: 1, cm: 10, in: 25.4, pt: 25.4 / 72, px: 25.4 / 96 }

// "9.5pt", "12px", "1cm", 4 → tall i ønsket enhet. Uten enhet brukes defaultUnit.
export function parseLength(value: unknown, defaultUnit: string, to: 'mm' | 'pt'): number | null {
  const match = String(value ?? '').trim().match(/^(\d+(?:\.\d+)?|\.\d+)\s*(mm|cm|in|pt|px)?$/)
  if (!match) return null
  const mm = Number(match[1]) * MM_PER[match[2] ?? defaultUnit]
  return to === 'mm' ? mm : mm / MM_PER.pt
}

function isColor(value: string): boolean {
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return true
  // Nettleseren vet best hvilke farger den forstår (rgb(), hsl(), navn som "teal" …)
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', value)
}

// Egen CSS: fjern det som kan hente noe utenfra, og lås resten til arket.
export function sanitizeCss(input: string): { css: string; warnings: string[] } {
  const warnings: string[] = []
  let css = input.replace(/\/\*[\s\S]*?\*\//g, '') // kommentarer (kan skjule klammer)
  if (!css.trim()) return { css: '', warnings }

  // @import henter en annen fil
  if (/@import/i.test(css)) {
    css = css.replace(/@import[^;]*;?/gi, '')
    warnings.push('css: @import is not allowed and was removed.')
  }
  // url() og image-set() til eksterne adresser. data:-adresser er greit (de er innebygd).
  let removedUrl = false
  css = css.replace(/\b(url|image-set)\(([^)]*)\)/gi, (whole, _fn: string, inner: string) => {
    const target = inner.trim().replace(/^['"]|['"]$/g, '').trim()
    if (/^data:/i.test(target) && !/image-set/i.test(whole)) return whole
    removedUrl = true
    return 'none'
  })
  if (removedUrl) warnings.push('css: url() pointing outside the CV is not allowed and was removed.')
  css = css.replace(/<\//g, '') // aldri avslutte <style>-taggen

  // Ubalanserte klammer kunne "rømme" ut av .cv-page og endre resten av appen
  let depth = 0
  for (const char of css) {
    if (char === '{') depth++
    if (char === '}' && --depth < 0) break
  }
  if (depth !== 0) {
    warnings.push('css: the braces { } do not match, so your CSS was ignored.')
    return { css: '', warnings }
  }

  // CSS-nesting: alle reglene gjelder bare inni arket
  return { css: `.cv-page {\n${css.trim()}\n}`, warnings }
}

// ---------- Skrive tilbake ----------

// Sett (eller fjern, med undefined) én verdi i front matter. Resten av teksten, også
// kommentarer og rekkefølge i YAML-en, beholdes. Blir front matter tom, fjernes den helt.
export function updateFrontMatter(source: string, path: string[], value: unknown): string {
  const { frontMatter, body } = splitFrontMatter(source)
  const doc = frontMatter?.trim() ? parseDocument(frontMatter) : new Document({})
  if (doc.errors.length > 0 || !isMap(doc.contents)) return source // ugyldig YAML: ikke rør den

  if (value === undefined) {
    doc.deleteIn(path)
    // Fjern tomme grupper, f.eks. labels: {} når siste etikett er fjernet
    if (path.length > 1) {
      const parent = doc.getIn(path.slice(0, -1))
      if (isMap(parent) && parent.items.length === 0) doc.deleteIn(path.slice(0, -1))
    }
  } else if (Array.isArray(value)) {
    // Lister på én linje: sidebar: [Skills, Languages]
    const node = doc.createNode(value)
    node.flow = true
    doc.setIn(path, node)
  } else {
    doc.setIn(path, value)
  }

  if (!isMap(doc.contents) || doc.contents.items.length === 0) {
    // Ingen innstillinger igjen. Behold eventuelle kommentarer, ellers fjern blokken.
    if (!doc.commentBefore && !doc.comment) return body
  }
  return `---\n${doc.toString({ flowCollectionPadding: false })}---\n${body}`
}
