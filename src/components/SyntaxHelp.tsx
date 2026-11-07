import { X } from 'lucide-react'
import { syntaxRules } from '../syntaxRules'

type SyntaxHelpProps = {
  onClose: () => void
}

// Jukselapp over editoren. Editoren under er fortsatt i bruk mens den er åpen.
export function SyntaxHelp({ onClose }: SyntaxHelpProps) {
  return (
    <aside className="syntax-help" aria-label="Syntax">
      <div className="syntax-help-header">
        <strong>How to write your CV</strong>
        <button onClick={onClose}>
          <X size={14} aria-hidden="true" />
          Close
        </button>
      </div>

      <dl className="syntax-rules">
        {syntaxRules.map((rule) => (
          <div className="syntax-rule" key={rule.title}>
            <dt>{rule.title}</dt>
            <dd>
              <pre>{rule.example}</pre>
              <p>{rule.result}</p>
            </dd>
          </div>
        ))}
      </dl>

      <p className="syntax-help-note">
        Each ### and the text below it stays together on one page in the PDF. Pandoc syntax (
        <code>::: header</code>, <code>[text]{'{.aside}'}</code>) works too.
      </p>
    </aside>
  )
}
