import { useEffect, useState } from 'react'
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

  // Lagre automatisk hver gang verdiene endres
  useEffect(() => save('markdown', markdown), [markdown])
  useEffect(() => save('theme', themeId), [themeId])

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
        onThemeChange={setThemeId}
        onUpload={setMarkdown}
        onPrint={handlePrint}
      />
      <main className="split">
        <Editor value={markdown} onChange={setMarkdown} />
        <Preview markdown={markdown} theme={findTheme(themeId)} />
      </main>
    </div>
  )
}
