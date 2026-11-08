import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronRight, RotateCcw, TriangleAlert } from 'lucide-react'
import { parseDocument } from 'yaml'
import type { Settings } from '../settings'
import type { Theme } from '../themes'
import { effectiveValues, modifiedFields } from '../cvStyle'
import { findFont, fontOptions } from '../fonts'
import { renderMarkdown } from '../markdown'
import { structureCv } from '../structure'
import { splitFrontMatter } from '../settings'
import { load, save } from '../storage'

type CustomizePanelProps = {
  markdown: string
  settings: Settings
  theme: Theme
  yamlOk: boolean // false: YAML-en har syntaksfeil, så panelet kan ikke skrive til den
  onSet: (path: string[], value: unknown) => void // undefined = fjern nøkkelen
  onReset: () => void
}

// Panelet leser og skriver bare front matter. Teksten er sannheten, så editoren og
// panelet er alltid like. En verdi lik themets standard fjernes fra front matter.
export function CustomizePanel({
  markdown,
  settings,
  theme,
  yamlOk,
  onSet,
  onReset,
}: CustomizePanelProps) {
  const defaults = theme.defaults
  const current = effectiveValues(theme, settings)
  // Bare verdier som avviker fra themets standard vises som endret (med tilbakestill-knapp)
  const modified = modifiedFields(theme, settings)

  // Tall: lik standard (innenfor et halvt steg) → fjern, ellers skriv med enhet
  function setNumber(path: string[], value: number, standard: number, step: number, unit = '') {
    if (Math.abs(value - standard) < step / 2) onSet(path, undefined)
    else onSet(path, unit ? `${round(value)}${unit}` : round(value))
  }

  function setMargins(y: number, x: number) {
    const sameAsDefault =
      Math.abs(y - defaults.margins.y) < 0.5 && Math.abs(x - defaults.margins.x) < 0.5
    if (sameAsDefault) onSet(['margins'], undefined)
    else onSet(['margins'], y === x ? `${y}mm` : `${y}mm ${x}mm`)
  }

  // Fonter: et valg fra listen, themets standard, eller et eget navn
  const knownFont = settings.font ? findFont(settings.font) : undefined
  const [customFont, setCustomFont] = useState(false)
  const showCustomFont = customFont || (settings.font !== undefined && !knownFont)
  const fontSelectValue = showCustomFont ? '__custom' : (knownFont?.name ?? '')

  // Sidekolonnen: hvilke ## seksjoner finnes, og hvilke havner der i dag
  const isSidebarLayout = theme.layout === 'sidebar'
  const sections = useMemo(() => {
    if (!isSidebarLayout) return { all: [], inSidebar: [], automatic: [] }
    const html = renderMarkdown(markdown)
    const headings = (layout: 'single' | 'sidebar', selector: string, sidebar?: string[]) => {
      const container = document.createElement('div')
      container.innerHTML = structureCv(html, layout, { sidebar })
      return [...container.querySelectorAll(selector)].map((h) => h.textContent!.trim())
    }
    return {
      all: headings('single', 'section > h2'), // i samme rekkefølge som i CV-en
      inSidebar: headings('sidebar', '.sidebar section > h2', settings.sidebar),
      automatic: headings('sidebar', '.sidebar section > h2'),
    }
  }, [markdown, settings.sidebar, isSidebarLayout])

  function toggleSidebar(heading: string, checked: boolean) {
    const next = sections.all.filter((h) => (h === heading ? checked : sections.inSidebar.includes(h)))
    const sameAsAutomatic =
      next.length === sections.automatic.length && next.every((h) => sections.automatic.includes(h))
    onSet(['sidebar'], sameAsAutomatic ? undefined : next)
  }

  // Egne valg for sidekolonnen teller bare hvis de gir noe annet enn det automatiske
  const sidebarModified =
    settings.sidebar !== undefined &&
    (sections.inSidebar.length !== sections.automatic.length ||
      sections.inSidebar.some((h) => !sections.automatic.includes(h)))

  // Egen CSS og filnavn står rått i front matter (settings.css er allerede renset og pakket inn)
  const raw = useMemo(() => rawFrontMatter(markdown), [markdown])
  const [cssDraft, setCssDraft] = useState(raw.css)
  const [lastRawCss, setLastRawCss] = useState(raw.css)
  // Endret utenfra (i editoren, Undo): ta inn den nye teksten. Ellers beholdes utkastet,
  // så markøren ikke hopper når YAML-en fjerner mellomrom på slutten.
  if (raw.css !== lastRawCss) {
    setLastRawCss(raw.css)
    if (raw.css.trimEnd() !== cssDraft.trimEnd()) setCssDraft(raw.css)
  }
  const defaultFilename = (() => {
    const name = splitFrontMatter(markdown).body.match(/^#\s+(.+)$/m)?.[1].trim()
    return name ? `CV - ${name}` : 'CV'
  })()

  // Hvor mange endringer hver seksjon har (vises som «2 changed»)
  const counts = {
    type: [modified.accent, modified.font, modified.fontSize, modified.lineHeight].filter(Boolean).length,
    spacing: [modified.margins, modified.sectionGap, modified.entryGap].filter(Boolean).length,
    layout: sidebarModified ? 1 : 0,
    labels: modified.contact ? 1 : 0,
    advanced: [raw.css.trim() !== '', settings.filename !== undefined].filter(Boolean).length,
  }
  const resettable = counts.type + counts.spacing + counts.layout + counts.labels

  // Hvilke seksjoner som er åpne huskes i nettleseren
  const [openSections, setOpenSections] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(load('customize-open', '["type"]'))
      return Array.isArray(saved) ? saved : ['type']
    } catch {
      return ['type']
    }
  })
  function toggleSection(id: string) {
    const next = openSections.includes(id) ? openSections.filter((s) => s !== id) : [...openSections, id]
    setOpenSections(next)
    save('customize-open', JSON.stringify(next))
  }
  const section = (id: keyof typeof counts, title: string) => ({
    id,
    title,
    changed: counts[id],
    open: openSections.includes(id),
    onToggle: () => toggleSection(id),
  })

  return (
    <div className="customize">
      {!yamlOk && (
        <p className="customize-blocked" role="alert">
          <TriangleAlert size={14} aria-hidden="true" />
          The settings at the top of your Markdown have an error. Fix it in the Markdown tab to use
          Customize.
        </p>
      )}

      <fieldset disabled={!yamlOk}>
        <Section {...section('type', 'Type and color')}>
          <Field
            label="Accent color"
            htmlFor="c-accent"
            modified={modified.accent}
            onReset={() => onSet(['accent'], undefined)}
            value={current.accent}
          >
            <input
              id="c-accent"
              type="color"
              value={toHex(current.accent)}
              onChange={(e) =>
                onSet(['accent'], e.target.value.toLowerCase() === toHex(defaults.accent) ? undefined : e.target.value)
              }
            />
          </Field>

          <Field
            label="Font"
            htmlFor="c-font"
            modified={modified.font}
            onReset={() => {
              setCustomFont(false)
              onSet(['font'], undefined)
            }}
          >
            <select
              id="c-font"
              value={fontSelectValue}
              onChange={(e) => {
                const choice = e.target.value
                setCustomFont(choice === '__custom')
                if (choice !== '__custom') onSet(['font'], choice || undefined)
              }}
            >
              <option value="">Theme default</option>
              <optgroup label="Included">
                {fontOptions.filter((f) => f.bundled).map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="System fonts">
                {fontOptions.filter((f) => !f.bundled).map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </optgroup>
              <option value="__custom">Other font installed on this computer…</option>
            </select>
          </Field>
          {showCustomFont && (
            <Field label="Font name" htmlFor="c-font-name">
              <input
                id="c-font-name"
                type="text"
                placeholder="e.g. Lato"
                value={knownFont ? '' : (settings.font ?? '')}
                onChange={(e) => onSet(['font'], e.target.value.trim() || undefined)}
              />
            </Field>
          )}

          <Slider
            label="Font size"
            id="c-font-size"
            value={current.fontSize}
            min={7}
            max={13}
            step={0.25}
            unit="pt"
            modified={modified.fontSize}
            onChange={(v) => setNumber(['font-size'], v, defaults.fontSize, 0.25, 'pt')}
            onReset={() => onSet(['font-size'], undefined)}
          />
          <Slider
            label="Line height"
            id="c-line-height"
            value={current.lineHeight}
            min={1.1}
            max={1.8}
            step={0.05}
            modified={modified.lineHeight}
            onChange={(v) => setNumber(['line-height'], v, defaults.lineHeight, 0.05)}
            onReset={() => onSet(['line-height'], undefined)}
          />
        </Section>

        <Section {...section('spacing', 'Spacing')}>
          <Slider
            label="Margins top and bottom"
            id="c-margin-y"
            value={current.margins.y}
            min={5}
            max={35}
            step={1}
            unit="mm"
            modified={modified.margins}
            onChange={(v) => setMargins(v, current.margins.x)}
            onReset={() => onSet(['margins'], undefined)}
          />
          <Slider
            label="Margins at the sides"
            id="c-margin-x"
            value={current.margins.x}
            min={5}
            max={35}
            step={1}
            unit="mm"
            modified={modified.margins}
            onChange={(v) => setMargins(current.margins.y, v)}
            onReset={() => onSet(['margins'], undefined)}
          />
          <Slider
            label="Space between sections"
            id="c-section-gap"
            value={current.sectionGap}
            min={0}
            max={12}
            step={0.5}
            unit="mm"
            modified={modified.sectionGap}
            onChange={(v) => setNumber(['section-gap'], v, defaults.sectionGap, 0.5, 'mm')}
            onReset={() => onSet(['section-gap'], undefined)}
          />
          <Slider
            label="Space between entries"
            id="c-entry-gap"
            value={current.entryGap}
            min={0}
            max={8}
            step={0.5}
            unit="mm"
            modified={modified.entryGap}
            onChange={(v) => setNumber(['entry-gap'], v, defaults.entryGap, 0.5, 'mm')}
            onReset={() => onSet(['entry-gap'], undefined)}
          />
        </Section>

        <Section {...section('layout', 'Layout')}>
          {isSidebarLayout ? (
            <>
              <p className="customize-hint">
                {sidebarModified
                  ? 'These sections go in the sidebar:'
                  : 'Sections with a skills list (**Label:** items) go in the sidebar automatically. Pick your own:'}
              </p>
              {sections.all.length === 0 && (
                <p className="customize-hint">Add ## sections to your CV to choose them here.</p>
              )}
              {sections.all.map((heading) => (
                <label key={heading} className="customize-check">
                  <input
                    type="checkbox"
                    checked={sections.inSidebar.includes(heading)}
                    onChange={(e) => toggleSidebar(heading, e.target.checked)}
                  />
                  {heading}
                </label>
              ))}
              {sidebarModified && (
                <button type="button" className="link-button" onClick={() => onSet(['sidebar'], undefined)}>
                  <RotateCcw size={13} aria-hidden="true" />
                  Back to automatic
                </button>
              )}
            </>
          ) : (
            <p className="customize-hint">
              {theme.name} uses a single column. Choose Modern in the toolbar to get a sidebar for contact
              details and skills.
            </p>
          )}
        </Section>

        <Section {...section('labels', 'Labels')}>
          <Field
            label="Contact heading"
            htmlFor="c-contact"
            hint={isSidebarLayout ? undefined : 'Shown in themes with a sidebar, like Modern.'}
            modified={modified.contact}
            onReset={() => onSet(['labels', 'contact'], undefined)}
          >
            <input
              id="c-contact"
              type="text"
              placeholder={defaults.labels.contact}
              value={settings.labels?.contact ?? ''}
              onChange={(e) => {
                const text = e.target.value
                onSet(['labels', 'contact'], text.trim() === '' || text.trim() === defaults.labels.contact ? undefined : text)
              }}
            />
          </Field>
        </Section>

        <Section {...section('advanced', 'Advanced')}>
          <Field label="File name" htmlFor="c-filename" hint="Used for the PDF and the .md file.">
            <input
              id="c-filename"
              type="text"
              placeholder={defaultFilename}
              value={raw.filename}
              onChange={(e) => onSet(['filename'], e.target.value.trim() ? e.target.value : undefined)}
            />
          </Field>
          <label className="customize-label-block" htmlFor="c-css">
            Your own CSS
          </label>
          <textarea
            id="c-css"
            spellCheck={false}
            placeholder={'.header h1 { letter-spacing: 0 }\nh2 { text-transform: none }'}
            value={cssDraft}
            onChange={(e) => {
              setCssDraft(e.target.value)
              onSet(['css'], e.target.value.trim() ? e.target.value : undefined)
            }}
          />
          <p className="customize-hint customize-hint-after">
            Applies only to the CV sheet. Links to outside files are not allowed. Not affected by Reset.
          </p>
        </Section>
      </fieldset>

      {resettable > 0 ? (
        <div className="customize-footer">
          <span>
            {resettable} {resettable === 1 ? 'change' : 'changes'} from {theme.name}
          </span>
          <button type="button" className="btn btn-secondary btn-sm" disabled={!yamlOk} onClick={onReset}>
            <RotateCcw size={14} aria-hidden="true" />
            Reset to theme defaults
          </button>
        </div>
      ) : (
        <p className="customize-note">
          Everything here is saved as settings at the top of your Markdown, so it travels with the file.
        </p>
      )}
    </div>
  )
}

// ---------- Små byggeklosser ----------

type SectionProps = {
  id: string
  title: string
  changed: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}

// Sammenleggbar seksjon. Innholdet blir i DOM-en (skjult), så høyden kan animeres.
function Section({ id, title, changed, open, onToggle, children }: SectionProps) {
  const bodyId = `cz-${id}`
  return (
    <section className="cz-section">
      <h3>
        <button type="button" className="cz-header" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
          <ChevronRight size={16} className="cz-chevron" aria-hidden="true" />
          <span className="cz-title">{title}</span>
          {changed > 0 && <span className="cz-changed">{changed} changed</span>}
        </button>
      </h3>
      <div className="cz-body" id={bodyId} data-open={open} inert={!open}>
        <div className="cz-body-inner">
          <div className="cz-content">{children}</div>
        </div>
      </div>
    </section>
  )
}

type FieldProps = {
  label: string
  htmlFor: string
  children: ReactNode
  value?: string // vises til høyre (f.eks. hex-koden)
  hint?: string
  modified?: boolean // endret fra themets standard: vis «tilbakestill»-knapp
  onReset?: () => void
}

function Field({ label, htmlFor, children, value, hint, modified, onReset }: FieldProps) {
  return (
    <div className="customize-field">
      <label htmlFor={htmlFor}>{label}</label>
      <div className="customize-control">
        {children}
        {value && <span className="customize-value">{value}</span>}
        {modified && onReset && (
          <button type="button" className="icon-button customize-reset" title={`Reset ${label.toLowerCase()}`} onClick={onReset}>
            <RotateCcw size={13} aria-hidden="true" />
            <span className="visually-hidden">Reset {label.toLowerCase()}</span>
          </button>
        )}
      </div>
      {hint && <p className="customize-hint">{hint}</p>}
    </div>
  )
}

type SliderProps = {
  label: string
  id: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  modified: boolean
  onChange: (value: number) => void
  onReset: () => void
}

function Slider({ label, id, value, min, max, step, unit, modified, onChange, onReset }: SliderProps) {
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0
  return (
    <Field
      label={label}
      htmlFor={id}
      value={`${value.toFixed(decimals)}${unit ? ` ${unit}` : ''}`}
      modified={modified}
      onReset={onReset}
    >
      <input
        id={id}
        // Fylt del av sporet (Chrome/Safari har ingen egen stil for den)
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  )
}

// Fargevelgeren forstår bare #rrggbb. Andre formater (rgb(), navn) vises som svart i velgeren,
// men står uendret i front matter til brukeren velger en ny farge.
function toHex(color: string): string {
  const short = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase()
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : '#000000'
}

// Unngå 9.250000001 i front matter
function round(value: number): number {
  return Math.round(value * 100) / 100
}

// css og filename slik de står skrevet i front matter (tom tekst hvis de mangler eller YAML-en er ugyldig)
function rawFrontMatter(markdown: string): { css: string; filename: string } {
  const { frontMatter } = splitFrontMatter(markdown)
  if (!frontMatter?.trim()) return { css: '', filename: '' }
  const doc = parseDocument(frontMatter)
  if (doc.errors.length > 0) return { css: '', filename: '' }
  const text = (key: string) => {
    const value = doc.get(key)
    return value === null || value === undefined ? '' : String(value)
  }
  return { css: text('css'), filename: text('filename') }
}
