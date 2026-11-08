import { useState } from 'react'
import { ArrowUpRight, Info, Lock } from 'lucide-react'
import { Dialog } from './Dialog'
import { LogoMark } from './Logo'

export const GITHUB_URL = 'https://github.com/pthormodsen/CvCreator'

export function Footer() {
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <footer className="app-footer">
      <span className="app-footer-privacy">
        <Lock size={13} aria-hidden="true" />
        Your CV never leaves your browser
      </span>
      <nav className="app-footer-links" aria-label="About Resumark">
        <button type="button" onClick={() => setAboutOpen(true)}>
          <Info size={13} aria-hidden="true" />
          <span>About</span>
        </button>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          <span>GitHub</span>
          <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </nav>

      <Dialog
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="About Resumark"
        actions={
          <>
            <a className="btn btn-secondary" href={GITHUB_URL} target="_blank" rel="noreferrer">
              View on GitHub
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <button type="button" className="btn btn-primary" data-autofocus onClick={() => setAboutOpen(false)}>
              Done
            </button>
          </>
        }
      >
        <div className="welcome-hero">
          <LogoMark />
          <p>A CV editor that turns Markdown into a clean A4 PDF.</p>
        </div>
        <p>
          Everything happens in your browser. There is no account and no server that stores your CV. The text
          is saved in this browser only, so use File → Save as .md to keep a copy or move it to another device.
        </p>
        <p>Resumark is open source.</p>
      </Dialog>
    </footer>
  )
}
