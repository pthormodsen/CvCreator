import type { Layout } from '../structure'
import './classic.css'
import './modern.css'
import './minimal.css'

// Slik legger du til et nytt theme:
//   1. Lag src/themes/<id>.css med alle regler inni .theme-<id> { ... }
//   2. Importer filen over og legg til en linje i listen under
export type Theme = {
  id: string
  name: string
  layout: Layout // 'sidebar' flytter kontaktinfo og ferdigheter til en sidekolonne
}

export const themes: Theme[] = [
  { id: 'classic', name: 'Classic', layout: 'single' },
  { id: 'modern', name: 'Modern', layout: 'sidebar' },
  { id: 'minimal', name: 'Minimal', layout: 'single' },
]

export function findTheme(id: string): Theme {
  return themes.find((t) => t.id === id) ?? themes[0]
}
