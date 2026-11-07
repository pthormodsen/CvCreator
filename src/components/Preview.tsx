import { useMemo } from 'react'
import { renderMarkdown } from '../markdown'
import { structureCv } from '../structure'
import type { Theme } from '../themes'

type PreviewProps = {
  markdown: string
  theme: Theme
}

export function Preview({ markdown, theme }: PreviewProps) {
  // markdown → HTML → CV-struktur. useMemo: kjør bare på nytt når tekst eller layout endres.
  const html = useMemo(
    () => structureCv(renderMarkdown(markdown), theme.layout),
    [markdown, theme.layout],
  )

  return (
    <div className="preview">
      {/* .cv-page er A4-arket, og det eneste som blir med i utskriften. */}
      {/* Theme-klassen (f.eks. .theme-classic) styrer hvordan innholdet ser ut. */}
      {/* dangerouslySetInnerHTML er greit her: HTML-en kommer fra brukerens egen tekst. */}
      <article
        className={`cv-page theme-${theme.id}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
