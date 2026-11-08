import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fontene til app-UI-et (Geist). CV-fontene lastes i fonts.ts.
import '@fontsource/geist/400.css'
import '@fontsource/geist/500.css'
import '@fontsource/geist/600.css'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/600.css'
import './tokens.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
