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
