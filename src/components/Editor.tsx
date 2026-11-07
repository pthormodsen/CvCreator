import { useState } from 'react'
import { CircleHelp } from 'lucide-react'
import { MarkdownEditor } from './MarkdownEditor'
import { SyntaxHelp } from './SyntaxHelp'

type EditorProps = {
  value: string
  onChange: (value: string) => void
  inactive: boolean // skjult fane på mobil
}

export function Editor({ value, onChange, inactive }: EditorProps) {
  // Om jukselappen er åpen, er bare UI-tilstand for denne komponenten
  const [showHelp, setShowHelp] = useState(false)

  return (
    <section className={inactive ? 'pane is-inactive' : 'pane'}>
      <div className="pane-header">
        <span className="pane-title" id="editor-title">
          Markdown
        </span>
        <button className="pane-button" aria-expanded={showHelp} onClick={() => setShowHelp(!showHelp)}>
          <CircleHelp size={14} aria-hidden="true" />
          Syntax
        </button>
      </div>
      <div className="editor-body">
        {showHelp && <SyntaxHelp onClose={() => setShowHelp(false)} />}
        <MarkdownEditor value={value} onChange={onChange} labelledBy="editor-title" />
      </div>
    </section>
  )
}
