import { createContext, useContext } from 'react'

// Toast-meldinger nederst på skjermen og bekreftelsesdialoger i stedet for window.confirm().
// Selve visningen står i FeedbackProvider.tsx. Komponentene bruker bare hookene under.

export type ToastOptions = {
  message: string
  action?: { label: string; onClick: () => void } // f.eks. «Undo»
  duration?: number // ms før den forsvinner av seg selv
}

export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'default' | 'danger' // danger: rød knapp, for ting som sletter tekst
}

export type Feedback = {
  toast: (options: ToastOptions) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

export const FeedbackContext = createContext<Feedback | null>(null)

export function useFeedback(): Feedback {
  const feedback = useContext(FeedbackContext)
  if (!feedback) throw new Error('useFeedback must be used inside <FeedbackProvider>')
  return feedback
}
