import { useMemo, useState, type ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import type { Settings } from '../settings'
import type { Theme } from '../themes'
import { effectiveValues, modifiedFields } from '../cvStyle'
import { findFont, fontOptions } from '../fonts'
import { renderMarkdown } from '../markdown'
import { structureCv } from '../structure'
import { ThemePicker } from './ThemePicker'

type CustomizePanelProps = {
  markdown: string
  settings: Settings
  theme: Theme
  yamlOk: boolean // false: YAML-en har syntaksfeil, så panelet kan ikke skrive til den
  onSet: (path: string[], value: unknown) => void // undefined = fjern nøkkelen
  onReset: () => void
  onThemeChange: (id: string) => void
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
  onThemeChange,
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
  const anyModified = Object.values(modified).some(Boolean) || sidebarModified

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
        <Group title="Theme">
          <ThemePicker name="customize-theme" themeId={theme.id} onChange={onThemeChange} />
        </Group>

        <Group title="Color and type">
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
        </Group>

        <Group title="Spacing">
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
        </Group>

        <Group title="Labels">
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
        </Group>

        {isSidebarLayout && (
          <Group title="Sidebar">
            <p className="customize-hint">
              {sidebarModified
                ? 'Chosen sections go in the sidebar.'
                : 'Now: sections with a skills list (**Label:** items) go in the sidebar automatically.'}
            </p>
            {sections.all.length === 0 && <p className="customize-hint">Add ## sections to your CV to choose them here.</p>}
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
              <button type="button" className="customize-link" onClick={() => onSet(['sidebar'], undefined)}>
                <RotateCcw size={13} aria-hidden="true" />
                Back to automatic
              </button>
            )}
          </Group>
        )}

        <div className="customize-footer">
          <button type="button" disabled={!anyModified} onClick={onReset}>
            <RotateCcw size={14} aria-hidden="true" />
            Reset to theme defaults
          </button>
          <p className="customize-hint">
            Everything here is saved as settings at the top of your Markdown (front matter), so it travels
            with the file. File name and your own CSS can be set there too. See Syntax.
          </p>
        </div>
      </fieldset>
    </div>
  )
}

// ---------- Små byggeklosser ----------

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="customize-group">
      <h3>{title}</h3>
      {children}
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
          <button type="button" className="customize-reset" title={`Reset ${label.toLowerCase()}`} onClick={onReset}>
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
