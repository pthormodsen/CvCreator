// Resumark-merket: et bokmerke (the «mark») på en blå flate.
// Samme tegning står i public/favicon.svg.
export function LogoMark({ className = 'brand-mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--color-accent, #1f3fd1)" />
      <path d="M11 8.5h10a1 1 0 0 1 1 1V24l-6-4.2-6 4.2V9.5a1 1 0 0 1 1-1z" fill="#fff" />
    </svg>
  )
}
