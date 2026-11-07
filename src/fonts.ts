// Fra fontnavnet i front matter (font: Georgia) til en CSS font-family med reserver.

// Et navn med komma er allerede en liste ("Inter, sans-serif"). Ellers setter vi navnet
// i anførselstegn og legger til en generisk reserve.
export function fontStack(name: string): string {
  if (name.includes(',')) return name
  const clean = name.replace(/["']/g, '').trim()
  return `"${clean}", sans-serif`
}
