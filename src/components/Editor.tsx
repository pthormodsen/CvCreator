import { useState } from 'react'
import { SyntaxHelp } from './SyntaxHelp'

type EditorProps = {
  value: string
  onChange: (value: string) => void
  inactive: boolean // skjult fane på mobil
}

// "Kontrollert" textarea: React eier verdien, og hvert tastetrykk sendes opp til App.
export function Editor({ value, onChange, inactive }: EditorProps) {
  // Om jukselappen er åpen, er bare UI-tilstand for denne komponenten
  const [showHelp, setShowHelp] = useState(false)

  return (
    <section className={inactive ? 'pane is-inactive' : 'pane'}>
      <div className="pane-header">
        <label className="pane-title" htmlFor="editor">
          Markdown
        </label>
        <button className="pane-button" aria-expanded={showHelp} onClick={() => setShowHelp(!showHelp)}>
          Syntaks
        </button>
      </div>
      <div className="editor-body">
        {showHelp && <SyntaxHelp onClose={() => setShowHelp(false)} />}
        <textarea
          id="editor"
          className="editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </section>
  )
}
