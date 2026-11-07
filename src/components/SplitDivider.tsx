import type { KeyboardEvent, PointerEvent } from 'react'
import { clampSplit, DEFAULT_SPLIT, MAX_SPLIT, MIN_SPLIT } from '../split'

type SplitDividerProps = {
  ratio: number
  onChange: (ratio: number) => void // mens man drar
  onCommit: (ratio: number) => void // når man slipper (lagres)
}

// Skillelinjen mellom editor og forhåndsvisning. Dra med musen, bruk piltastene,
// eller dobbeltklikk for å gå tilbake til 40/60.
export function SplitDivider({ ratio, onChange, onCommit }: SplitDividerProps) {
  // Andelen av bredden til venstre for musepekeren, målt i .split-elementet
  function ratioAt(e: PointerEvent<HTMLDivElement>) {
    const split = e.currentTarget.parentElement!.getBoundingClientRect()
    return clampSplit((e.clientX - split.left) / split.width)
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    // Pointer capture: vi får alle musebevegelser, også når pekeren er utenfor linjen
    e.currentTarget.setPointerCapture(e.pointerId)
    document.body.classList.add('is-resizing')
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) onChange(ratioAt(e))
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    document.body.classList.remove('is-resizing')
    onCommit(ratioAt(e))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 0.1 : 0.02
    if (e.key === 'ArrowLeft') onCommit(clampSplit(ratio - step))
    else if (e.key === 'ArrowRight') onCommit(clampSplit(ratio + step))
    else return
    e.preventDefault()
  }

  return (
    <div
      className="split-divider"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize editor and preview"
      aria-valuemin={MIN_SPLIT * 100}
      aria-valuemax={MAX_SPLIT * 100}
      aria-valuenow={Math.round(ratio * 100)}
      tabIndex={0}
      title="Drag to resize. Double-click to reset."
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      onDoubleClick={() => onCommit(DEFAULT_SPLIT)}
    />
  )
}
