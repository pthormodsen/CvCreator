import type { Layout } from '../structure'
import './base.css'
import './classic.css'
import './modern.css'
import './minimal.css'

// Et theme = standardverdier + layout.
//   - Standardverdiene under blir CSS-variabler (--cv-accent, --cv-font-size …) på arket.
//     Front matter i CV-en kan overstyre dem.
//   - Layouten står i src/themes/<id>.css, og bruker bare variablene.
//
// Slik legger du til et nytt theme:
//   1. Lag src/themes/<id>.css med alle regler inni .theme-<id> { ... }
//   2. Importer filen over og legg til et objekt i listen under

export type ThemeDefaults = {
  accent: string // CSS-farge
  font: string // CSS font-family (en liste med reserver)
  fontSize: number // pt
  lineHeight: number
  margins: { y: number; x: number } // mm: topp/bunn og sider
  sectionGap: number // mm over hver ## seksjon
  entryGap: number // mm over hver ### erfaring
  labels: { contact: string }
}

export type Theme = {
  id: string
  name: string
  layout: Layout // 'sidebar' flytter kontaktinfo og ferdigheter til en sidekolonne
  defaults: ThemeDefaults
}

// Noen opprinnelige verdier var i px. Vi regner dem om til mm (1 px = 25,4 / 96 mm),
// så utseendet blir nøyaktig det samme som før.
const px = (value: number) => (value * 25.4) / 96

export const themes: Theme[] = [
  {
    id: 'classic',
    name: 'Classic',
    layout: 'single',
    defaults: {
      accent: '#1f4e79',
      font: '"Helvetica Neue", "Segoe UI", Arial, sans-serif',
      fontSize: 9.5,
      lineHeight: 1.4,
      margins: { y: 14, x: 16 },
      sectionGap: px(13),
      entryGap: px(9),
      labels: { contact: 'Contact' },
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    layout: 'sidebar',
    defaults: {
      accent: '#0f766e',
      font: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      fontSize: 9,
      lineHeight: 1.38,
      margins: { y: 12, x: 13 },
      sectionGap: px(10),
      entryGap: px(6),
      labels: { contact: 'Contact' },
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    layout: 'single',
    defaults: {
      accent: '#000000',
      font: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
      fontSize: 9,
      lineHeight: 1.4,
      margins: { y: 16, x: 18 },
      sectionGap: 5,
      entryGap: px(6),
      labels: { contact: 'Contact' },
    },
  },
]

export function findTheme(id: string): Theme {
  return themes.find((t) => t.id === id) ?? themes[0]
}

// CSS-variablene som settes på arket (style="--cv-accent: …")
export function themeVariables(defaults: ThemeDefaults): Record<string, string> {
  return {
    '--cv-accent': defaults.accent,
    '--cv-font': defaults.font,
    '--cv-font-size': `${defaults.fontSize}pt`,
    '--cv-line-height': String(defaults.lineHeight),
    '--cv-margins': `${defaults.margins.y}mm ${defaults.margins.x}mm`,
    '--cv-section-gap': `${defaults.sectionGap}mm`,
    '--cv-entry-gap': `${defaults.entryGap}mm`,
  }
}
