import { useMemo, useState, type CSSProperties } from 'react'
import { Eye, Pencil } from 'lucide-react'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { Toolbar } from './components/Toolbar'
import { SplitDivider } from './components/SplitDivider'
import { clampSplit, DEFAULT_SPLIT } from './split'
import { findTheme } from './themes'
import { load, remove, save } from './storage'
import { parseCv, updateFrontMatter } from './settings'
import { effectiveValues } from './cvStyle'
import { fontsReadyFor } from './fonts'
import defaultCv from './defaultCv.md?raw'

// Startteksten. Tidligere lå valgt theme i localStorage. Nå står det i front matter
// (theme: modern), så det følger med filen. Et gammelt valg flyttes over én gang.
// Dette kjører én gang når filen lastes, ikke inni React (StrictMode kjører ting to ganger).
function loadInitialMarkdown(): string {
  let markdown = load('markdown', defaultCv)
  const legacyTheme = load('theme', '')
  if (legacyTheme) {
    if (legacyTheme !== 'classic' && !parseCv(markdown).settings.theme) {
      markdown = updateFrontMatter(markdown, ['theme'], legacyTheme)
      save('markdown', markdown)
    }
    remove('theme')
  }
  return markdown
}
const initialMarkdown = loadInitialMarkdown()

export default function App() {
  // All tilstand bor her og sendes ned som props. Ingen state-bibliotek trengs.
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const [saved, setSaved] = useState(true)
  // Innstillingene leses fra front matter hver gang teksten endres
  const cv = useMemo(() => parseCv(markdown), [markdown])
  const theme = findTheme(cv.settings.theme ?? 'classic')
  // Hvilken fane som vises på smal skjerm. På bred skjerm vises begge panelene.
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  // Hvor stor andel av bredden editoren får (0.4 = 40 %). Lagres når brukeren slipper skillelinjen.
  const [split, setSplit] = useState(() => clampSplit(Number(load('split', String(DEFAULT_SPLIT)))))

  function commitSplit(ratio: number) {
    setSplit(ratio)
    save('split', String(ratio))
  }

  // All endring av teksten går gjennom denne, som også lagrer og husker
  // om lagringen lyktes (vises som «Saved in browser» i verktøylinjen).
  function updateMarkdown(text: string) {
    setMarkdown(text)
    setSaved(save('markdown', text))
  }

  // Theme lagres i front matter. Classic er standard, så da fjernes nøkkelen.
  function updateTheme(id: string) {
    updateMarkdown(updateFrontMatter(markdown, ['theme'], id === 'classic' ? undefined : id))
  }

  // Spør før vi erstatter tekst brukeren har skrevet selv
  function confirmReplace(message: string): boolean {
    const untouched = markdown.trim() === '' || markdown === defaultCv
    return untouched || window.confirm(message)
  }

  function handleUpload(text: string) {
    if (confirmReplace('Replace your text with the file you opened? What you have written will be lost.')) {
      updateMarkdown(text)
    }
  }

  function handleReset() {
    if (
      confirmReplace(
        'Replace your text with the example CV? What you have written will be lost. Use “Save as file” first if you want to keep it.',
      )
    ) {
      updateMarkdown(defaultCv)
    }
  }

  // Filnavn: filename i front matter, ellers «CV - Navn» fra første #-linje
  const name = cv.body.match(/^#\s+(.+)$/m)?.[1].trim()
  const filename = cv.settings.filename ?? (name ? `CV - ${name}` : 'CV')

  async function handlePrint() {
    // Fonten må være lastet før utskrift, ellers kan PDF-en få reservefonten
    await fontsReadyFor(effectiveValues(theme, cv.settings).font)
    // Nettleseren foreslår document.title som filnavn for PDF-en
    const previousTitle = document.title
    document.title = filename
    window.print()
    document.title = previousTitle
  }

  return (
    <div className="app">
      <Toolbar
        markdown={markdown}
        filename={filename}
        themeId={theme.id}
        saved={saved}
        onThemeChange={updateTheme}
        onUpload={handleUpload}
        onReset={handleReset}
        onPrint={handlePrint}
      />
      {/* Faner, bare synlige på smal skjerm (se .tabs i index.css) */}
      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'write'} onClick={() => setTab('write')}>
          <Pencil size={16} aria-hidden="true" />
          Write
        </button>
        <button role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>
          <Eye size={16} aria-hidden="true" />
          Preview
        </button>
      </nav>
      {/* --split styrer kolonnebredden i CSS, så mobil-layouten fortsatt kan overstyre den */}
      <main className="split" style={{ '--split': `${split * 100}%` } as CSSProperties}>
        <Editor value={markdown} onChange={updateMarkdown} warnings={cv.warnings} inactive={tab !== 'write'} />
        <SplitDivider ratio={split} onChange={setSplit} onCommit={commitSplit} />
        <Preview markdown={markdown} settings={cv.settings} theme={theme} inactive={tab !== 'preview'} />
      </main>
    </div>
  )
}
