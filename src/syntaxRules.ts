// Reglene som vises i jukselappen («Syntaks»-knappen).
// syntaxRules.test.ts sjekker at hvert eksempel faktisk gir resultatet som beskrives,
// så jukselappen ikke kan gli fra hva koden gjør.

export type SyntaxRule = {
  title: string
  example: string
  result: string
  selector: string // CSS-selektor eksempelet skal gi (brukes i testen)
  afterName?: boolean // regelen gjelder bare under # Navn (testen legger det til)
}

export const syntaxRules: SyntaxRule[] = [
  {
    title: 'Navn',
    example: '# Ola Nordmann',
    result: 'Navnet ditt øverst i CV-en. Bare den første #-linjen brukes.',
    selector: '.header h1',
  },
  {
    title: 'Undertittel',
    example: 'Utvikler · Backend og sky',
    result: 'Avsnittet rett under navnet, hvis det ikke har lenker.',
    selector: '.header .subtitle',
    afterName: true,
  },
  {
    title: 'Kontaktinfo',
    example: '[ola@example.com](mailto:ola@example.com) · [github.com/ola](https://github.com/ola)\\\n[olanordmann.no](https://example.com)',
    result: 'Første avsnitt med lenker før første ##. Avslutt en linje med \\ for linjeskift.',
    selector: '.header .contact a',
    afterName: true,
  },
  {
    title: 'Seksjon',
    example: '## Arbeidserfaring',
    result: 'Overskrift for en del av CV-en.',
    selector: 'section > h2',
  },
  {
    title: 'Erfaring med dato',
    example: '### Utvikler, Firma AS | 2022 – nå · Oslo',
    result: 'Tittel til venstre. Alt etter | havner til høyre: dato, sted eller lenker.',
    selector: 'h3 .aside',
  },
  {
    title: 'Teknologier',
    example: '### Chess | 2025\n\n*Java · React · PostgreSQL*',
    result: 'En linje i kursiv rett under ### blir en liten teknologilinje.',
    selector: 'p.stack',
  },
  {
    title: 'Ferdigheter',
    example: '- **Språk:** Java, Python\n- **Verktøy:** Git, Docker',
    result:
      'En liste der alle punktene starter med **Etikett:** blir to kolonner. I Modern havner den i sidekolonnen.',
    selector: 'dl dt',
  },
  {
    title: 'Vanlig markdown',
    example: '- Et punkt\n\n**fet**, *kursiv*, [lenke](https://example.com)',
    result: 'Punktlister, fet, kursiv og lenker fungerer som vanlig.',
    selector: 'ul li',
  },
]
