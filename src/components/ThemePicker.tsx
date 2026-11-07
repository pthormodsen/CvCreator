import type { ReactNode } from 'react'
import { themes } from '../themes'

// Små statiske miniatyrer av hvert theme (30 × 40, som et A4-ark).
// Et nytt theme uten miniatyr får et blankt ark.
const thumbnails: Record<string, ReactNode> = {
  classic: (
    <>
      <rect x="4" y="5" width="13" height="3" rx="0.5" fill="#1f4e79" />
      <rect x="20" y="5" width="6" height="1.2" fill="#8c959f" />
      <rect x="20" y="7" width="6" height="1.2" fill="#8c959f" />
      <rect x="4" y="10.5" width="22" height="0.8" fill="#1f4e79" />
      <rect x="4" y="14" width="8" height="1.4" fill="#1f4e79" />
      <rect x="4" y="17" width="22" height="1" fill="#c9d1d9" />
      <rect x="4" y="19" width="18" height="1" fill="#c9d1d9" />
      <rect x="4" y="23" width="8" height="1.4" fill="#1f4e79" />
      <rect x="4" y="26" width="22" height="1" fill="#c9d1d9" />
      <rect x="4" y="28" width="20" height="1" fill="#c9d1d9" />
      <rect x="4" y="30" width="22" height="1" fill="#c9d1d9" />
    </>
  ),
  modern: (
    <>
      <rect x="3" y="3" width="24" height="7" rx="0.8" fill="#0f766e" />
      <rect x="5" y="5.5" width="10" height="2" fill="#fff" />
      <rect x="3" y="12" width="7.5" height="22" rx="0.8" fill="#d5ebe9" />
      <rect x="13" y="12.5" width="7" height="1.4" fill="#0f766e" />
      <rect x="13" y="15.5" width="14" height="1" fill="#c9d1d9" />
      <rect x="13" y="17.5" width="12" height="1" fill="#c9d1d9" />
      <rect x="13" y="21" width="7" height="1.4" fill="#0f766e" />
      <rect x="13" y="24" width="14" height="1" fill="#c9d1d9" />
      <rect x="13" y="26" width="13" height="1" fill="#c9d1d9" />
      <rect x="13" y="28" width="14" height="1" fill="#c9d1d9" />
    </>
  ),
  minimal: (
    <>
      <rect x="8" y="5" width="14" height="2" fill="#1f2328" />
      <rect x="10" y="9" width="10" height="0.9" fill="#8c959f" />
      <rect x="4" y="14" width="5" height="1" fill="#57606a" />
      <rect x="11" y="14" width="15" height="1" fill="#c9d1d9" />
      <rect x="11" y="16.5" width="13" height="1" fill="#c9d1d9" />
      <rect x="4" y="21" width="5" height="1" fill="#57606a" />
      <rect x="11" y="21" width="15" height="1" fill="#c9d1d9" />
      <rect x="11" y="23.5" width="14" height="1" fill="#c9d1d9" />
      <rect x="11" y="26" width="12" height="1" fill="#c9d1d9" />
    </>
  ),
}

type ThemePickerProps = {
  themeId: string
  onChange: (id: string) => void
  name: string // unikt per velger, ellers blir to velgere på siden én radiogruppe
}

// Ekte radioknapper (skjult) under miniatyrene: da får vi piltaster og
// skjermleserstøtte fra nettleseren uten ekstra kode.
export function ThemePicker({ themeId, onChange, name }: ThemePickerProps) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label="Theme">
      {themes.map((theme) => (
        <label key={theme.id} className="theme-option" title={theme.name}>
          <input
            type="radio"
            name={name}
            value={theme.id}
            checked={theme.id === themeId}
            onChange={() => onChange(theme.id)}
          />
          <svg className="theme-thumbnail" viewBox="0 0 30 40" aria-hidden="true">
            <rect x="0.5" y="0.5" width="29" height="39" rx="1.5" fill="#fff" stroke="#d0d7de" />
            {thumbnails[theme.id]}
          </svg>
          <span className="theme-name">{theme.name}</span>
        </label>
      ))}
    </div>
  )
}
