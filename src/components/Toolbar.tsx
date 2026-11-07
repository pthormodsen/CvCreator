import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import { themes } from '../themes'
import { load, save } from '../storage'
import { useDismiss } from '../useDismiss'
import { MoreMenu } from './MoreMenu'

type ToolbarProps = {
  markdown: string
  themeId: string
  saved: boolean
  onThemeChange: (id: string) => void
  onUpload: (text: string) => void
  onReset: () => void
  onPrint: () => void
}

export function Toolbar({
  markdown,
  themeId,
  saved,
  onThemeChange,
  onUpload,
  onReset,
  onPrint,
}: ToolbarProps) {
  // Referanse til den skjulte fil-inputen, så en vanlig knapp kan åpne den
  const fileInput = useRef<HTMLInputElement>(null)

  function openFilePicker() {
    fileInput.current?.click()
  }

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

  // Første gang: forklar at PDF lages via utskriftsdialogen før vi åpner den.
  // (Chromes dialog dekker hele siden, så hintet må vises før, ikke samtidig.)
  const [showPdfHint, setShowPdfHint] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)
  const closePdfHint = useCallback(() => setShowPdfHint(false), [])
  useDismiss(showPdfHint, closePdfHint, pdfRef)

  function handlePdfClick() {
    if (load('pdf-hint-seen', '')) onPrint()
    else setShowPdfHint(true)
  }

  function confirmPdf() {
    save('pdf-hint-seen', 'yes')
    setShowPdfHint(false)
    onPrint()
  }

  return (
    <header className="toolbar">
      {/* Venstre: filhandlinger og lagringsstatus. På mobil ligger filhandlingene i «Mer». */}
      <div className="toolbar-group">
        <span className="toolbar-title wide-only">CV Builder</span>
        <input
          ref={fileInput}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={handleFile}
          hidden
        />
        <button className="wide-only" onClick={openFilePicker}>
          Last opp .md
        </button>
        <button className="wide-only" onClick={downloadMarkdown}>
          Last ned .md
        </button>
        <MoreMenu
          items={[
            { label: 'Last opp .md', onSelect: openFilePicker, className: 'narrow-only' },
            { label: 'Last ned .md', onSelect: downloadMarkdown, className: 'narrow-only' },
            { label: 'Tilbakestill til eksempel', onSelect: onReset },
          ]}
        />
        <span
          className={saved ? 'save-status' : 'save-status save-status-error'}
          role="status"
          title={
            saved
              ? 'Teksten og valgt theme lagres automatisk i denne nettleseren.'
              : 'Nettleseren tillater ikke lagring (f.eks. privat modus). Last ned .md for å ta vare på teksten.'
          }
        >
          {saved ? '✓' : '⚠'}
          <span className="wide-only">{saved ? ' Lagret i nettleseren' : ' Ikke lagret'}</span>
        </span>
      </div>

      {/* Høyre: utseende og hovedhandlingen */}
      <div className="toolbar-group">
        <label className="theme-select">
          <span className="wide-only">Theme</span>
          <select
            value={themeId}
            aria-label="Theme"
            onChange={(e) => onThemeChange(e.target.value)}
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <div className="pdf-action" ref={pdfRef}>
          <button className="primary" onClick={handlePdfClick}>
            Last ned PDF
          </button>
          {showPdfHint && (
            <div className="popover" role="dialog" aria-label="Slik lagrer du PDF">
              <p>
                PDF-en lages med nettleserens utskrift. Velg <strong>Lagre som PDF</strong> i
                dialogen.
              </p>
              <div className="popover-actions">
                <button onClick={closePdfHint}>Avbryt</button>
                <button className="primary" autoFocus onClick={confirmPdf}>
                  Åpne utskrift
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
