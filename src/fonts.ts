// Fonter. Fire fonter følger med appen (@fontsource, ingen kall til Google Fonts),
// i tillegg kan brukeren velge systemfonter eller skrive navnet på en hvilken som helst
// font som er installert på maskinen.

// Vektene themene bruker: 400 (vanlig), 500, 600, 700 (fet) og kursiv.
// Hver fil har @font-face med unicode-range, så nettleseren laster bare ned det som brukes.
import '@fontsource/inter/400.css'
import '@fontsource/inter/400-italic.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/400-italic.css'
import '@fontsource/source-serif-4/500.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/700.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/400-italic.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/400-italic.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import '@fontsource/ibm-plex-mono/700.css'

export type FontOption = {
  name: string // det brukeren skriver i front matter: font: Inter
  stack: string // CSS font-family med reserver
  bundled: boolean // følger med appen
}

export const fontOptions: FontOption[] = [
  { name: 'Inter', stack: '"Inter", system-ui, sans-serif', bundled: true },
  { name: 'Source Serif 4', stack: '"Source Serif 4", Georgia, serif', bundled: true },
  { name: 'IBM Plex Sans', stack: '"IBM Plex Sans", system-ui, sans-serif', bundled: true },
  { name: 'IBM Plex Mono', stack: '"IBM Plex Mono", ui-monospace, monospace', bundled: true },
  { name: 'System UI', stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', bundled: false },
  { name: 'Helvetica', stack: '"Helvetica Neue", Helvetica, Arial, sans-serif', bundled: false },
  { name: 'Arial', stack: 'Arial, "Helvetica Neue", sans-serif', bundled: false },
  { name: 'Georgia', stack: 'Georgia, "Times New Roman", serif', bundled: false },
  { name: 'Times', stack: '"Times New Roman", Times, serif', bundled: false },
  { name: 'Palatino', stack: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif', bundled: false },
  { name: 'Menlo', stack: 'Menlo, Consolas, ui-monospace, monospace', bundled: false },
]

export function findFont(name: string): FontOption | undefined {
  const wanted = name.trim().toLowerCase()
  return fontOptions.find((font) => font.name.toLowerCase() === wanted)
}

// Fra navnet i front matter til en CSS font-family:
//   - kjent navn (Inter, Georgia …) → listen over
//   - noe med komma ("Lato, sans-serif") → brukes som det er
//   - et annet navn → "Navnet" + en reserve som ligner (serif, monospace eller sans-serif)
export function fontStack(name: string): string {
  const known = findFont(name)
  if (known) return known.stack
  if (name.includes(',')) return name
  const clean = name.replace(/["']/g, '').trim()
  return `"${clean}", ${genericFallback(clean)}`
}

function genericFallback(name: string): string {
  if (/mono|code|courier|consol/i.test(name)) return 'monospace'
  if (/serif|times|georgia|garamond|palatino|baskerville|book|minion/i.test(name) && !/sans/i.test(name)) {
    return 'serif'
  }
  return 'sans-serif'
}

// Vent til fonten (alle vektene themene bruker) er lastet, før utskrift.
// En font lastes ellers først når den trengs, og da kunne PDF-en fått reservefonten.
export async function fontsReadyFor(stack: string, timeoutMs = 3000): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  const family = stack.split(',')[0].trim()
  const variants = ['400', 'italic 400', '500', '600', '700']
  const loading = Promise.all(variants.map((v) => document.fonts.load(`${v} 12px ${family}`))).then(
    () => document.fonts.ready,
  )
  // Aldri vent for alltid: etter timeoutMs skrives det ut uansett
  await Promise.race([loading, new Promise((resolve) => setTimeout(resolve, timeoutMs))]).catch(() => {})
}
