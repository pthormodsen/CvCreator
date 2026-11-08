import { useState } from 'react'
import { Download, Lock, Palette, PenLine } from 'lucide-react'
import { load, save } from '../storage'
import { Dialog } from './Dialog'

// Vises én gang: første besøk, og bare hvis det ikke finnes en lagret CV fra før
// (de som brukte appen før velkomsten fantes, trenger den ikke).
function isFirstVisit(): boolean {
  return !load('welcome-seen', '') && !load('markdown', '')
}

export function Welcome() {
  const [open, setOpen] = useState(isFirstVisit)

  function close() {
    save('welcome-seen', 'yes')
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Welcome to Resumark"
      size="md"
      actions={
        <button type="button" className="btn btn-primary" data-autofocus onClick={close}>
          Start writing
        </button>
      }
    >
      <p>Write your CV as plain text and get a clean, print-ready A4 PDF.</p>
      <ol className="welcome-steps">
        <li>
          <span>
            <PenLine size={16} aria-hidden="true" />
          </span>
          <div>
            <strong>Write in Markdown</strong>
            Replace the example on the left with your own text. Syntax shows everything you can use.
          </div>
        </li>
        <li>
          <span>
            <Palette size={16} aria-hidden="true" />
          </span>
          <div>
            <strong>Pick a look</strong>
            Choose a theme in the toolbar, then fine-tune fonts and spacing under Customize.
          </div>
        </li>
        <li>
          <span>
            <Download size={16} aria-hidden="true" />
          </span>
          <div>
            <strong>Download the PDF</strong>
            The preview shows exactly where each page ends.
          </div>
        </li>
      </ol>
      <p className="welcome-privacy">
        <Lock size={14} aria-hidden="true" />
        Your CV never leaves your browser. No account, no upload.
      </p>
    </Dialog>
  )
}
