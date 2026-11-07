import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { renderMarkdown } from '../markdown'
import { structureCv } from '../structure'
import { paginate, type Pagination } from '../pagination'
import type { Theme } from '../themes'

type PreviewProps = {
  markdown: string
  theme: Theme
  inactive: boolean // skjult fane på mobil
}

// A4-bredde i CSS-piksler: 210 mm × 96 px per tomme / 25,4 mm per tomme
const A4_WIDTH_PX = (210 * 96) / 25.4

export function Preview({ markdown, theme, inactive }: PreviewProps) {
  // markdown → HTML → CV-struktur. useMemo: kjør bare på nytt når tekst eller layout endres.
  const html = useMemo(
    () => structureCv(renderMarkdown(markdown), theme.layout),
    [markdown, theme.layout],
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const [fit, setFit] = useState(true) // «Fit» eller «100%»
  const [fitScale, setFitScale] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const scale = fit ? fitScale : 1

  const measurePages = useCallback(() => {
    if (sheetRef.current) setPagination(paginate(sheetRef.current))
  }, [])

  // Skaler arket så det passer i kolonnen. ResizeObserver sier fra hver gang
  // kolonnen endrer bredde, også når fanen blir synlig på mobil.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width // plassen innenfor padding
      if (width === 0) return // skjult fane
      setFitScale(Math.min(1, width / A4_WIDTH_PX))
      measurePages()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [measurePages])

  // Mål sidene på nytt når innholdet eller themet endres. useLayoutEffect kjører etter at
  // DOM-en er oppdatert, men før skjermen tegnes, så linjene kommer på plass uten å blinke.
  // Å måle DOM-en og lagre resultatet er et av tilfellene der setState i en effekt er riktig.
  useLayoutEffect(() => {
    measurePages()
  }, [html, theme.id, measurePages])

  const pages = pagination?.pages ?? 1

  return (
    <section className={inactive ? 'pane is-inactive' : 'pane'}>
      <div className="pane-header">
        {/* På mobil står «Preview» allerede i fanen, så tittelen skjules der */}
        <span className="pane-title wide-only">Preview</span>
        <div className="pane-actions">
          <span className="pane-info">
            {pages} {pages === 1 ? 'page' : 'pages'}
            {pagination && pagination.moved > 0 && (
              <span
                className="pane-warning"
                title="Blocks with a red outline don’t fit at the bottom of the page and move to the next page in the PDF."
              >
                {' '}
                · {pagination.moved} moved
              </span>
            )}
          </span>
          <div className="segmented" role="group" aria-label="Zoom">
            <button aria-pressed={fit} onClick={() => setFit(true)}>
              Fit{fit && fitScale < 1 ? ` ${Math.round(fitScale * 100)}%` : ''}
            </button>
            <button aria-pressed={!fit} onClick={() => setFit(false)}>
              100%
            </button>
          </div>
        </div>
      </div>

      <div className="preview" ref={containerRef}>
        {/* zoom skalerer arket og linjene sammen, uten tomrom rundt */}
        <div className="sheet" style={{ zoom: scale }}>
          {/* .cv-page er A4-arket, og det eneste som blir med i utskriften. */}
          {/* dangerouslySetInnerHTML er greit her: HTML-en kommer fra brukerens egen tekst. */}
          <article
            ref={sheetRef}
            className={`cv-page theme-${theme.id}`}
            style={{ minHeight: pagination?.sheetHeight }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {/* Stiplet linje der hver side slutter i PDF-en */}
          {pagination?.breaks.map((y, i) => (
            <div key={i} className="page-break" style={{ top: y }} aria-hidden="true">
              <span>Page {i + 2}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
