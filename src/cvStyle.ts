// Slår sammen themets standardverdier med innstillingene fra front matter.
// Rekkefølge: theme-standard → front matter → egen CSS (som legges i en <style> etterpå).

import type { Settings } from './settings'
import { themeVariables, type Theme, type ThemeDefaults } from './themes'
import { fontStack } from './fonts'

// Verdiene som faktisk gjelder for denne CV-en
export function effectiveValues(theme: Theme, settings: Settings): ThemeDefaults {
  const d = theme.defaults
  return {
    accent: settings.accent ?? d.accent,
    font: settings.font ? fontStack(settings.font) : d.font,
    fontSize: settings.fontSize ?? d.fontSize,
    lineHeight: settings.lineHeight ?? d.lineHeight,
    margins: settings.margins ?? d.margins,
    sectionGap: settings.sectionGap ?? d.sectionGap,
    entryGap: settings.entryGap ?? d.entryGap,
    labels: { contact: settings.labels?.contact ?? d.labels.contact },
  }
}

// CSS-variablene som settes på arket
export function cvVariables(theme: Theme, settings: Settings): Record<string, string> {
  const variables = themeVariables(effectiveValues(theme, settings))
  // Lys bakgrunnsfarge (sidekolonnen i Modern) følger accent når brukeren har valgt en egen
  if (settings.accent) {
    variables['--cv-accent-soft'] = `color-mix(in srgb, ${settings.accent} 10%, white)`
  }
  return variables
}

// Hvilke verdier som faktisk avviker fra themets standard. En nøkkel i front matter
// med samme verdi som standarden (f.eks. font-size: 9.5pt i Classic) regnes ikke som endret.
export type Modified = Record<'accent' | 'font' | 'fontSize' | 'lineHeight' | 'margins' | 'sectionGap' | 'entryGap' | 'contact', boolean>

export function modifiedFields(theme: Theme, settings: Settings): Modified {
  const d = theme.defaults
  const v = effectiveValues(theme, settings)
  // Lengder kan være regnet om fra cm/pt/px, så små avrundingsforskjeller teller ikke
  const differs = (a: number, b: number) => Math.abs(a - b) > 1e-6
  return {
    accent: normalizeColor(v.accent) !== normalizeColor(d.accent),
    font: v.font !== d.font,
    fontSize: differs(v.fontSize, d.fontSize),
    lineHeight: differs(v.lineHeight, d.lineHeight),
    margins: differs(v.margins.y, d.margins.y) || differs(v.margins.x, d.margins.x),
    sectionGap: differs(v.sectionGap, d.sectionGap),
    entryGap: differs(v.entryGap, d.entryGap),
    contact: v.labels.contact !== d.labels.contact,
  }
}

// #ABC og #aabbcc er samme farge
function normalizeColor(color: string): string {
  const c = color.trim().toLowerCase()
  const short = c.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/)
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : c
}
