// Hvor stor andel av bredden editoren får. Ligger i egen fil fordi både App og
// SplitDivider bruker den (og en komponentfil bør bare eksportere komponenter).

export const DEFAULT_SPLIT = 0.4 // editor 40 %, forhåndsvisning 60 %
export const MIN_SPLIT = 0.25
export const MAX_SPLIT = 0.75

export function clampSplit(ratio: number): number {
  if (!Number.isFinite(ratio)) return DEFAULT_SPLIT
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, ratio))
}
