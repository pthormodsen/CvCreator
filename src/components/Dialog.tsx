import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode // knappene nederst
  size?: 'sm' | 'md'
  className?: string
}

// Modal dialog bygget på <dialog> og showModal(): nettleseren gir oss fokusfelle,
// Escape for å lukke og et bakteppe, uten ekstra kode.
export function Dialog({ open, onClose, title, children, actions, size = 'sm', className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // showModal() gir fokus til første knapp (lukkekrysset). Hovedknappen er et bedre valg.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`dialog dialog-${size}${className ? ` ${className}` : ''}`}
      aria-labelledby={titleId}
      // Escape: la React styre lukkingen, så tilstanden alltid stemmer
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      // Klikk på bakteppet (utenfor innholdet) lukker
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="dialog-body">
          <header className="dialog-header">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
              <X size={16} aria-hidden="true" />
            </button>
          </header>
          <div className="dialog-content">{children}</div>
          {actions && <footer className="dialog-actions">{actions}</footer>}
        </div>
      )}
    </dialog>
  )
}
