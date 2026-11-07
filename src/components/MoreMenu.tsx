import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { useDismiss } from '../useDismiss'

export type MenuItem = {
  label: string
  icon?: ReactNode
  onSelect: () => void
  className?: string // f.eks. 'narrow-only' for punkter som bare vises på mobil
}

type MoreMenuProps = {
  items: MenuItem[]
}

// «More»-meny for handlinger som ikke skal ligge rett ved de vanlige knappene
export function MoreMenu({ items }: MoreMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // useCallback gir samme funksjon hver render, så useDismiss ikke kobler til lytterne på nytt
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, ref)

  // Flytt fokus til første synlige punkt når menyen åpnes (noen punkter er skjult på bred skjerm)
  useEffect(() => {
    if (!open) return
    const buttons = ref.current?.querySelectorAll<HTMLButtonElement>('.menu-list button') ?? []
    ;[...buttons].find((b) => b.offsetParent !== null)?.focus()
  }, [open])

  return (
    <div className="menu" ref={ref}>
      <button aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        More
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="menu-list" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              className={item.className}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
