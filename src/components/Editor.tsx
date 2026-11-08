import { useEffect, useRef, useState } from 'react'
import { CircleHelp, TriangleAlert } from 'lucide-react'
import type { Settings } from '../settings'
import type { Theme } from '../themes'
import { MarkdownEditor, type EditorController } from './MarkdownEditor'
import { SyntaxHelp } from './SyntaxHelp'
import { CustomizePanel } from './CustomizePanel'

type EditorProps = {
  value: string
  onChange: (value: string) => void
  settings: Settings
  theme: Theme
  warnings: string[] // problemer i innstillingene (front matter)
  yamlOk: boolean
  onSetSetting: (path: string[], value: unknown) => void
  onResetSettings: () => void
  inactive: boolean // skjult fane på mobil
}

// Venstre panel: fanene Markdown og Customize. Begge endrer den samme teksten.
export function Editor(props: EditorProps) {
  const { value, onChange, settings, theme, warnings, yamlOk, inactive } = props
  const [view, setView] = useState<'markdown' | 'customize'>('markdown')
  // Om jukselappen er åpen, er bare UI-tilstand for denne komponenten
  const [showHelp, setShowHelp] = useState(false)
  // Editoren beholdes (skjult) mens Customize er åpen, så angre-historikken ikke forsvinner
  const editorRef = useRef<EditorController>(null)

  // Mens Customize er åpen: Cmd/Ctrl+Z angrer i editoren (samme historikk som når man skriver),
  // Cmd+Shift+Z eller Ctrl+Y gjør om. Vi lytter på hele dokumentet, så det også virker når
  // fokus har havnet utenfor panelet (f.eks. etter at en knapp ble deaktivert).
  useEffect(() => {
    if (view !== 'customize') return
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      if (key === 'z' || key === 'y') {
        e.preventDefault()
        if (key === 'y' || e.shiftKey) editorRef.current?.redo()
        else editorRef.current?.undo()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [view])

  return (
    <section className={inactive ? 'pane is-inactive' : 'pane'}>
      <div className="pane-header">
        <div className="pane-tabs" role="tablist" aria-label="Editor">
          <button
            role="tab"
            id="editor-title"
            aria-selected={view === 'markdown'}
            onClick={() => setView('markdown')}
          >
            Markdown
          </button>
          <button role="tab" aria-selected={view === 'customize'} onClick={() => setView('customize')}>
            Customize
          </button>
        </div>
        {view === 'markdown' && (
          <button className="btn btn-ghost btn-sm" aria-expanded={showHelp} onClick={() => setShowHelp(!showHelp)}>
            <CircleHelp size={14} aria-hidden="true" />
            Syntax
          </button>
        )}
      </div>
      <div className="editor-body">
        {view === 'markdown' && showHelp && <SyntaxHelp onClose={() => setShowHelp(false)} />}
        {warnings.length > 0 && (
          <div className="settings-warnings" role="status">
            <TriangleAlert size={14} aria-hidden="true" />
            <ul>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        {view === 'customize' && (
          <CustomizePanel
            markdown={value}
            settings={settings}
            theme={theme}
            yamlOk={yamlOk}
            onSet={props.onSetSetting}
            onReset={props.onResetSettings}
          />
        )}
        <MarkdownEditor
          ref={editorRef}
          value={value}
          onChange={onChange}
          labelledBy="editor-title"
          hidden={view !== 'markdown'}
        />
      </div>
    </section>
  )
}
