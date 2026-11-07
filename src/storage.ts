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

// Returnerer true hvis lagringen lyktes, så appen kan vise det til brukeren
export function save(key: string, value: string): boolean {
  try {
    localStorage.setItem(PREFIX + key, value)
    return true
  } catch {
    return false
  }
}

export function remove(key: string) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // Ingenting å gjøre
  }
}
