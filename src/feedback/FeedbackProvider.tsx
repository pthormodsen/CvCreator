import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Dialog } from '../components/Dialog'
import { FeedbackContext, type ConfirmOptions, type Feedback, type ToastOptions } from './context'

type Toast = ToastOptions & { id: number; leaving: boolean }
type PendingConfirm = ConfirmOptions & { resolve: (ok: boolean) => void }

const LEAVE_MS = 180 // samme som --duration i tokens.css

// Gir resten av appen toast() og confirm(), og tegner meldingene og dialogen.
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    // Først en ut-animasjon, så fjernes den
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), LEAVE_MS)
  }, [])

  const toast = useCallback((options: ToastOptions) => {
    const id = nextId.current++
    // Høyst tre om gangen. En ny melding erstatter den eldste.
    setToasts((list) => [...list.slice(-2), { ...options, id, leaving: false }])
  }, [])

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  )

  function answer(ok: boolean) {
    pending?.resolve(ok)
    setPending(null)
  }

  const value = useMemo<Feedback>(() => ({ toast, confirm }), [toast, confirm])

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <Dialog
        open={pending !== null}
        onClose={() => answer(false)}
        title={pending?.title ?? ''}
        actions={
          pending && (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => answer(false)}>
                {pending.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                className={pending.tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
                autoFocus
                onClick={() => answer(true)}
              >
                {pending.confirmLabel}
              </button>
            </>
          )
        }
      >
        <p>{pending?.message}</p>
      </Dialog>

      <div className="toasts" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} dismiss={dismiss} />
        ))}
      </div>
    </FeedbackContext.Provider>
  )
}

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: number) => void }) {
  const onDismiss = useCallback(() => dismiss(toast.id), [dismiss, toast.id])
  // Forsvinner av seg selv, men ikke mens musen eller fokus er på den
  const [paused, setPaused] = useState(false)
  const duration = toast.duration ?? (toast.action ? 6000 : 3500)
  useEffect(() => {
    if (paused || toast.leaving) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [paused, toast.leaving, duration, onDismiss])

  return (
    <div
      className={toast.leaving ? 'toast is-leaving' : 'toast'}
      role="status"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="toast-message">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            toast.action!.onClick()
            onDismiss()
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className="toast-close" aria-label="Dismiss" onClick={onDismiss}>
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
