import { updateFrontMatter } from './settings'
import defaultCv from './defaultCv.md?raw'

// Eksempel-CV-en med themet brukeren har valgt, så «Reset to example» ikke bytter theme
export function exampleCv(themeId: string): string {
  return updateFrontMatter(defaultCv, ['theme'], themeId)
}
