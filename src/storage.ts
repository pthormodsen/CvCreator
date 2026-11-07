// Små hjelpere rundt localStorage. Den kan kaste feil (privat modus, blokkert lagring),
// så vi fanger det og faller tilbake til standardverdien.

const PREFIX = 'cv-builder:'

export function load(key: string, fallback: string): string {
  try {
    return localStorage.getItem(PREFIX + key) ?? fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: string) {
  try {
    localStorage.setItem(PREFIX + key, value)
  } catch {
    // Ignorer: appen virker fortsatt, den husker bare ikke teksten
  }
}
