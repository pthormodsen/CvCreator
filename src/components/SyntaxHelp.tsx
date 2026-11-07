import { syntaxRules } from '../syntaxRules'

type SyntaxHelpProps = {
  onClose: () => void
}

// Jukselapp over editoren. Editoren under er fortsatt i bruk mens den er åpen.
export function SyntaxHelp({ onClose }: SyntaxHelpProps) {
  return (
    <aside className="syntax-help" aria-label="Syntaks">
      <div className="syntax-help-header">
        <strong>Slik skriver du CV-en</strong>
        <button onClick={onClose}>Lukk</button>
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
        Hver ### med innholdet under holdes samlet på én side i PDF-en. Pandoc-syntaks (
        <code>::: header</code>, <code>[tekst]{'{.aside}'}</code>) fungerer også.
      </p>
    </aside>
  )
}
