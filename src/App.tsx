import { useState } from 'react'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { Toolbar } from './components/Toolbar'
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
    if (confirmReplace('Erstatte teksten med filen du lastet opp? Det du har skrevet nå blir borte.')) {
      updateMarkdown(text)
    }
  }

  function handleReset() {
    if (
      confirmReplace(
        'Erstatte teksten med eksempel-CV-en? Det du har skrevet blir borte. Last ned .md først hvis du vil beholde det.',
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
          Skriv
        </button>
        <button role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>
          Forhåndsvis
        </button>
      </nav>
      <main className="split">
        <Editor value={markdown} onChange={updateMarkdown} inactive={tab !== 'write'} />
        <Preview markdown={markdown} theme={findTheme(themeId)} inactive={tab !== 'preview'} />
      </main>
    </div>
  )
}
