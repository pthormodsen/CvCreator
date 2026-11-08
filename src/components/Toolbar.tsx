import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Download, FolderOpen, RotateCcw, Save } from 'lucide-react'
import { load, save } from '../storage'
import { useDismiss } from '../useDismiss'
import { FileMenu } from './FileMenu'
import { LogoMark } from './Logo'
import { ThemePicker } from './ThemePicker'

type ToolbarProps = {
  markdown: string
  filename: string // uten filendelse
  themeId: string
  saved: boolean
  onThemeChange: (id: string) => void
  onUpload: (text: string, name: string) => void
  onReset: () => void
  onPrint: () => void
  onSaved?: (name: string) => void
}

const ICON = 16 // ikonstørrelse i px
// ⌘ på Mac, Ctrl ellers (bare til visning i menyen)
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'

export function Toolbar({
  markdown,
  filename,
  themeId,
  saved,
  onThemeChange,
  onUpload,
  onReset,
  onPrint,
  onSaved,
}: ToolbarProps) {
  // Referanse til den skjulte fil-inputen, så en vanlig knapp kan åpne den
  const fileInput = useRef<HTMLInputElement>(null)

  function openFilePicker() {
    fileInput.current?.click()
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onUpload(await file.text(), file.name)
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
    onSaved?.(`${filename}.md`)
  }

  // Hurtigtaster: Cmd/Ctrl+O åpner, Cmd/Ctrl+S lagrer som fil (i stedet for nettleserens «Lagre side»)
  const shortcuts = useRef({ open: openFilePicker, save: downloadMarkdown })
  useEffect(() => {
    shortcuts.current = { open: openFilePicker, save: downloadMarkdown }
  })
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (key === 'o') shortcuts.current.open()
      else if (key === 's') shortcuts.current.save()
      else return
      e.preventDefault()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

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
      <a className="brand" href="/" aria-label="Resumark home">
        <LogoMark />
        <span className="brand-name">Resumark</span>
      </a>

      <input
        ref={fileInput}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        onChange={handleFile}
        hidden
      />
      <FileMenu
        items={[
          { label: 'Open file…', icon: <FolderOpen size={ICON} aria-hidden="true" />, shortcut: `${MOD}O`, onSelect: openFilePicker },
          { label: 'Save as .md', icon: <Save size={ICON} aria-hidden="true" />, shortcut: `${MOD}S`, onSelect: downloadMarkdown },
          'separator',
          { label: 'Reset to example', icon: <RotateCcw size={ICON} aria-hidden="true" />, onSelect: onReset },
        ]}
      />

      <span
        className={saved ? 'save-status wide-only' : 'save-status save-status-error'}
        role="status"
        title={
          saved
            ? 'Your text and theme are saved automatically in this browser.'
            : 'Your browser does not allow saving (for example in private mode). Use File → Save as .md to keep your text.'
        }
      >
        <span className="save-dot" aria-hidden="true" />
        <span className="save-text">{saved ? 'Saved in browser' : 'Not saved'}</span>
      </span>

      <span className="toolbar-spacer" />

      <ThemePicker name="toolbar-theme" themeId={themeId} onChange={onThemeChange} />

      <div className="pdf-action" ref={pdfRef}>
        <button className="btn btn-primary" onClick={handlePdfClick}>
          <Download size={ICON} aria-hidden="true" />
          <span>
            <span className="wide-only">Download </span>PDF
          </span>
        </button>
        {showPdfHint && (
          <div className="popover" role="dialog" aria-label="How to save the PDF">
            <p>
              The PDF is made with your browser’s print dialog. Choose <strong>Save as PDF</strong> as the
              destination.
            </p>
            <div className="popover-actions">
              <button className="btn btn-secondary btn-sm" onClick={closePdfHint}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" autoFocus onClick={confirmPdf}>
                Open print dialog
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
