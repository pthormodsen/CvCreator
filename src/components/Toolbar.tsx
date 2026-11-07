import { useRef, type ChangeEvent } from 'react'
import { themes } from '../themes'

type ToolbarProps = {
  markdown: string
  themeId: string
  onThemeChange: (id: string) => void
  onUpload: (text: string) => void
  onPrint: () => void
}

export function Toolbar({ markdown, themeId, onThemeChange, onUpload, onPrint }: ToolbarProps) {
  // Referanse til den skjulte fil-inputen, så en vanlig knapp kan åpne den
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onUpload(await file.text())
    e.target.value = '' // så samme fil kan velges på nytt
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cv.md'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <header className="toolbar">
      <span className="toolbar-title">CV Builder</span>

      <label>
        Theme{' '}
        <select value={themeId} onChange={(e) => onThemeChange(e.target.value)}>
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <div className="toolbar-actions">
        <input
          ref={fileInput}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={handleFile}
          hidden
        />
        <button onClick={() => fileInput.current?.click()}>Last opp .md</button>
        <button onClick={downloadMarkdown}>Last ned .md</button>
        <button className="primary" onClick={onPrint}>
          Last ned PDF
        </button>
      </div>
    </header>
  )
}
