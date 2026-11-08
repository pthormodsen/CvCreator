import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import { Check, FileDown, FolderOpen, RotateCcw, Save, TriangleAlert } from 'lucide-react'
import { load, save } from '../storage'
import { useDismiss } from '../useDismiss'
import { MoreMenu } from './MoreMenu'
import { ThemePicker } from './ThemePicker'

type ToolbarProps = {
  markdown: string
  filename: string // uten filendelse
  themeId: string
  saved: boolean
  onThemeChange: (id: string) => void
  onUpload: (text: string) => void
  onReset: () => void
  onPrint: () => void
}

const ICON = 16 // ikonstørrelse i px

export function Toolbar({
  markdown,
  filename,
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
    link.download = `${filename}.md`
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
      {/* Venstre: filhandlinger og lagringsstatus. På mobil ligger filhandlingene i «More». */}
      <div className="toolbar-group">
        <span className="toolbar-title wide-only">CV Builder</span>
        <input
          ref={fileInput}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={handleFile}
          hidden
        />
        <button className="btn btn-ghost wide-only" onClick={openFilePicker}>
          <FolderOpen size={ICON} aria-hidden="true" />
          Open
        </button>
        <button className="btn btn-ghost wide-only" onClick={downloadMarkdown}>
          <Save size={ICON} aria-hidden="true" />
          Save as file
        </button>
        <MoreMenu
          items={[
            {
              label: 'Open',
              icon: <FolderOpen size={ICON} aria-hidden="true" />,
              onSelect: openFilePicker,
              className: 'narrow-only',
            },
            {
              label: 'Save as file',
              icon: <Save size={ICON} aria-hidden="true" />,
              onSelect: downloadMarkdown,
              className: 'narrow-only',
            },
            {
              label: 'Reset to example',
              icon: <RotateCcw size={ICON} aria-hidden="true" />,
              onSelect: onReset,
            },
          ]}
        />
        <span
          className={saved ? 'save-status' : 'save-status save-status-error'}
          role="status"
          title={
            saved
              ? 'Your text and theme are saved automatically in this browser.'
              : 'Your browser does not allow saving (for example in private mode). Use “Save as file” to keep your text.'
          }
        >
          {saved ? <Check size={ICON} aria-hidden="true" /> : <TriangleAlert size={ICON} aria-hidden="true" />}
          <span className="save-text">{saved ? 'Saved in browser' : 'Not saved'}</span>
        </span>
      </div>

      {/* Høyre: utseende og hovedhandlingen */}
      <div className="toolbar-group">
        <ThemePicker name="toolbar-theme" themeId={themeId} onChange={onThemeChange} />

        <div className="pdf-action" ref={pdfRef}>
          <button className="btn btn-primary" onClick={handlePdfClick}>
            <FileDown size={ICON} aria-hidden="true" />
            <span>
              <span className="wide-only">Download </span>PDF
            </span>
          </button>
          {showPdfHint && (
            <div className="popover" role="dialog" aria-label="How to save the PDF">
              <p>
                The PDF is made with your browser’s print dialog. Choose <strong>Save as PDF</strong>{' '}
                as the destination.
              </p>
              <div className="popover-actions">
                <button className="btn btn-secondary" onClick={closePdfHint}>Cancel</button>
                <button className="btn btn-primary" autoFocus onClick={confirmPdf}>
                  Open print dialog
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
