import { useCallback, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { useDismiss } from '../useDismiss'

export type FileMenuItem =
  | { label: string; icon: ReactNode; shortcut?: string; onSelect: () => void }
  | 'separator'

// «File»-menyen i verktøylinjen. Piltastene flytter mellom valgene, Escape lukker
// og sender fokus tilbake til knappen.
export function FileMenu({ items }: { items: FileMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])
  useDismiss(open, close, ref)

  // Fokus på første valg når menyen åpnes (ref-callback kjører når listen dukker opp)
  const focusFirst = useCallback((list: HTMLDivElement | null) => {
    list?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [])

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const move: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: buttons.length - 1 }
    if (!(e.key in move)) return
    e.preventDefault()
    buttons[(move[e.key] + buttons.length) % buttons.length]?.focus()
  }

  return (
    <div className="menu" ref={ref}>
      <button
        ref={triggerRef}
        className="btn btn-ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="File"
        onClick={() => setOpen(!open)}
      >
        <FileText size={16} aria-hidden="true" />
        <span className="wide-only">File</span>
        <ChevronDown size={14} aria-hidden="true" className="wide-only" />
      </button>
      {open && (
        <div className="menu-list" role="menu" aria-label="File" ref={focusFirst} onKeyDown={handleKeyDown}>
          {items.map((item, i) =>
            item === 'separator' ? (
              <hr key={i} className="menu-separator" />
            ) : (
              <button
                key={item.label}
                role="menuitem"
                className="menu-item"
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
              >
                {item.icon}
                {item.label}
                {item.shortcut && <kbd>{item.shortcut}</kbd>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
