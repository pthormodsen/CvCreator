import { useState, type CSSProperties } from 'react'
import { Eye, Pencil } from 'lucide-react'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { Toolbar } from './components/Toolbar'
import { SplitDivider } from './components/SplitDivider'
import { clampSplit, DEFAULT_SPLIT } from './split'
import { findTheme } from './themes'
import { load, save } from './storage'
import defaultCv from './defaultCv.md?raw'

export default function App() {
  // All tilstand bor her og sendes ned som props. Ingen state-bibliotek trengs.
  // Funksjonen i useState kjøres bare første gang, så vi leser localStorage én gang.
  const [markdown, setMarkdown] = useState(() => load('markdown', defaultCv))
  const [themeId, setThemeId] = useState(() => findTheme(load('theme', 'classic')).id)
  const [saved, setSaved] = useState(true)
  // Hvilken fane som vises på smal skjerm. På bred skjerm vises begge panelene.
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  // Hvor stor andel av bredden editoren får (0.4 = 40 %). Lagres når brukeren slipper skillelinjen.
  const [split, setSplit] = useState(() => clampSplit(Number(load('split', String(DEFAULT_SPLIT)))))

  function commitSplit(ratio: number) {
    setSplit(ratio)
    save('split', String(ratio))
  }

  // All endring av tekst og theme går gjennom disse to, som også lagrer
  // og husker om lagringen lyktes (vises som «Lagret» i verktøylinjen).
  function updateMarkdown(text: string) {
    setMarkdown(text)
    setSaved(save('markdown', text))
  }

  function updateTheme(id: string) {
    setThemeId(id)
    setSaved(save('theme', id))
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

  function handlePrint() {
    // Nettleseren foreslår document.title som filnavn for PDF-en
    const name = markdown.match(/^#\s+(.+)$/m)?.[1].trim()
    const previousTitle = document.title
    if (name) document.title = `CV - ${name}`
    window.print()
    document.title = previousTitle
  }

  return (
    <div className="app">
      <Toolbar
        markdown={markdown}
        themeId={themeId}
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
        <Editor value={markdown} onChange={updateMarkdown} inactive={tab !== 'write'} />
        <SplitDivider ratio={split} onChange={setSplit} onCommit={commitSplit} />
        <Preview markdown={markdown} theme={findTheme(themeId)} inactive={tab !== 'preview'} />
      </main>
    </div>
  )
}
