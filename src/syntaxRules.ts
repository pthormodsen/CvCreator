// Reglene som vises i jukselappen («Syntax»-knappen).
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
    title: 'Name',
    example: '# Alex Morgan',
    result: 'Your name at the top of the CV. Only the first # line is used.',
    selector: '.header h1',
  },
  {
    title: 'Subtitle',
    example: 'Software Developer · Backend and Cloud',
    result: 'The paragraph right below your name, if it has no links.',
    selector: '.header .subtitle',
    afterName: true,
  },
  {
    title: 'Contact',
    example:
      '[alex@example.com](mailto:alex@example.com) · [github.com/alex](https://github.com/alex)\\\n[alexmorgan.dev](https://example.com)',
    result: 'The first paragraph with links before the first ##. End a line with \\ for a line break.',
    selector: '.header .contact a',
    afterName: true,
  },
  {
    title: 'Section',
    example: '## Experience',
    result: 'A heading for one part of the CV.',
    selector: 'section > h2',
  },
  {
    title: 'Entry with date',
    example: '### Developer, Acme Inc. | 2022 – present · London',
    result: 'Title on the left. Everything after | goes on the right: dates, place or links.',
    selector: 'h3 .aside',
  },
  {
    title: 'Technologies',
    example: '### Chess | 2025\n\n*Java · React · PostgreSQL*',
    result: 'An italic line right below ### becomes a small line of technologies.',
    selector: 'p.stack',
  },
  {
    title: 'Skills',
    example: '- **Languages:** Java, Python\n- **Tools:** Git, Docker',
    result:
      'A list where every item starts with **Label:** becomes two columns. In Modern it goes in the sidebar.',
    selector: 'dl dt',
  },
  {
    title: 'Plain Markdown',
    example: '- A bullet point\n\n**bold**, *italic*, [link](https://example.com)',
    result: 'Bullet lists, bold, italic and links work as usual.',
    selector: 'ul li',
  },
]
