type EditorProps = {
  value: string
  onChange: (value: string) => void
}

// "Kontrollert" textarea: React eier verdien, og hvert tastetrykk sendes opp til App.
export function Editor({ value, onChange }: EditorProps) {
  return (
    <textarea
      className="editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      aria-label="CV i markdown"
    />
  )
}
