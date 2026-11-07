// Den minste endringen som gjør `before` om til `after`: alt i midten mellom en felles
// start og en felles slutt. Brukes når teksten endres utenfra (f.eks. fra Customize-panelet),
// så editoren bare bytter ut det som faktisk er nytt. Da blir markøren stående, og
// angre-historikken får en liten, presis endring.
export type TextChange = { from: number; to: number; insert: string }

export function minimalChange(before: string, after: string): TextChange | null {
  if (before === after) return null
  let start = 0
  const maxStart = Math.min(before.length, after.length)
  while (start < maxStart && before[start] === after[start]) start++

  let endBefore = before.length
  let endAfter = after.length
  while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
    endBefore--
    endAfter--
  }
  return { from: start, to: endBefore, insert: after.slice(start, endAfter) }
}
