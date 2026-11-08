import { useMemo, useState, type CSSProperties } from 'react'
import { Eye, Pencil } from 'lucide-react'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { Toolbar } from './components/Toolbar'
import { Footer } from './components/Footer'
import { Welcome } from './components/Welcome'
import { SplitDivider } from './components/SplitDivider'
import { clampSplit, DEFAULT_SPLIT } from './split'
import { findTheme } from './themes'
import { load, remove, save } from './storage'
import { parseCv, updateFrontMatter } from './settings'
import { effectiveValues } from './cvStyle'
import { fontsReadyFor } from './fonts'
import { renderMarkdown } from './markdown'
import { unknownSidebarSections } from './structure'
import defaultCv from './defaultCv.md?raw'
import { exampleCv } from './example'
import { useFeedback } from './feedback/context'

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
  const { toast, confirm } = useFeedback()
  const [saved, setSaved] = useState(true)
  // Innstillingene leses fra front matter hver gang teksten endres
  const cv = useMemo(() => parseCv(markdown), [markdown])
  const theme = findTheme(cv.settings.theme ?? 'classic')
  // Advarsler: ugyldige verdier (fra parseCv) og navn i sidebar: som ikke finnes som ## i CV-en
  const warnings = useMemo(() => {
    const sidebar = cv.settings.sidebar
    if (!sidebar?.length) return cv.warnings
    const missing = unknownSidebarSections(renderMarkdown(markdown), sidebar)
    return [...cv.warnings, ...missing.map((name) => `sidebar: there is no ## section called "${name}".`)]
  }, [cv, markdown])
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

  // Theme lagres i front matter, så det følger med filen
  function updateTheme(id: string) {
    updateMarkdown(updateFrontMatter(markdown, ['theme'], id))
  }

  // Customize-panelet: sett eller fjern (undefined) én innstilling i front matter
  function updateSetting(path: string[], value: unknown) {
    updateMarkdown(updateFrontMatter(markdown, path, value))
  }

  // Bytt ut hele teksten og vis en melding med «Undo», som setter den gamle teksten tilbake
  function replaceWithUndo(text: string, message: string) {
    const previous = markdown
    updateMarkdown(text)
    toast({ message, action: { label: 'Undo', onClick: () => updateMarkdown(previous) } })
  }

  // «Reset to theme defaults»: fjern alle utseende-innstillingene i én endring (ett Cmd+Z).
  // Theme, filnavn og egen CSS beholdes. Ingen dialog: det kan angres med Undo i meldingen.
  function resetSettings() {
    const keys = ['accent', 'font', 'font-size', 'line-height', 'margins', 'section-gap', 'entry-gap', 'labels', 'sidebar']
    replaceWithUndo(
      keys.reduce((text, key) => updateFrontMatter(text, [key], undefined), markdown),
      'Reset to theme defaults',
    )
  }

  // Spør før vi erstatter tekst brukeren har skrevet selv
  async function confirmReplace(title: string, message: string): Promise<boolean> {
    const untouched = markdown.trim() === '' || markdown === defaultCv || markdown === exampleCv(theme.id)
    return untouched || confirm({ title, message, confirmLabel: 'Replace my text', tone: 'danger' })
  }

  async function handleUpload(text: string, name: string) {
    const ok = await confirmReplace(
      `Open “${name}”?`,
      'The file replaces the text in the editor. You can undo this right after, or save your current text first with File → Save as .md.',
    )
    if (ok) replaceWithUndo(text, `Opened ${name}`)
  }

  async function handleReset() {
    const ok = await confirmReplace(
      'Replace your CV with the example?',
      'The example replaces the text in the editor. You can undo this right after, or save your current text first with File → Save as .md.',
    )
    if (ok) replaceWithUndo(exampleCv(theme.id), 'Replaced with the example CV')
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
        onSaved={(name) => toast({ message: `Saved ${name}` })}
      />
      {/* Faner, bare synlige på smal skjerm (se .tabs i index.css) */}
      <nav className="tabs">
        <div className="segmented" role="tablist">
          <button className="segmented-option" role="tab" aria-selected={tab === 'write'} onClick={() => setTab('write')}>
            <Pencil size={15} aria-hidden="true" />
            Write
          </button>
          <button className="segmented-option" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>
            <Eye size={15} aria-hidden="true" />
            Preview
          </button>
        </div>
      </nav>
      {/* --split styrer kolonnebredden i CSS, så mobil-layouten fortsatt kan overstyre den */}
      <main className="split" style={{ '--split': `${split * 100}%` } as CSSProperties}>
        <Editor
          value={markdown}
          onChange={updateMarkdown}
          settings={cv.settings}
          theme={theme}
          warnings={warnings}
          yamlOk={cv.yamlOk}
          onSetSetting={updateSetting}
          onResetSettings={resetSettings}
          inactive={tab !== 'write'}
        />
        <SplitDivider ratio={split} onChange={setSplit} onCommit={commitSplit} />
        <Preview markdown={markdown} settings={cv.settings} theme={theme} inactive={tab !== 'preview'} />
      </main>
      <Footer />
      <Welcome />
    </div>
  )
}
