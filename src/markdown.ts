import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import bracketedSpans from 'markdown-it-bracketed-spans'
import deflist from 'markdown-it-deflist'

// Én delt markdown-it-instans. Pluginene gir oss Pandoc-syntaksen som CV-en bruker:
//   [tekst]{.subtitle}      → <span class="subtitle"> (bracketed-spans + attrs)
//   Ord\n: forklaring       → <dl><dt><dd>           (deflist)
const md = new MarkdownIt({ html: true, linkify: true })
  .use(bracketedSpans)
  .use(attrs)
  .use(deflist)

// Pandoc-blokker (fenced divs):
//   ::: header       → <div class="header">
//   :::              → </div>
// Vi gjør dem om til HTML-tagger før markdown-it ser teksten. Tomme linjer rundt
// taggene gjør at markdown-it fortsatt tolker innholdet mellom dem som markdown.
// (Enkel løsning: den skiller ikke på ::: inne i kodeblokker, men det trengs ikke i en CV.)
function fencedDivsToHtml(source: string): string {
  return source
    .split('\n')
    .map((line) => {
      const open = line.match(/^:{3,}\s*([\w-]+)\s*$/)
      if (open) return `\n<div class="${open[1]}">\n`
      if (/^:{3,}\s*$/.test(line)) return '\n</div>\n'
      return line
    })
    .join('\n')
}

// Rens HTML-en før den vises. html: true trengs fordi fencedDivsToHtml lager <div>-tagger,
// men det betyr også at en .md-fil fra noen andre kan inneholde <img onerror="..."> eller
// <script>. markdown-it-attrs slipper i tillegg gjennom vilkårlige attributter ({onclick=...}).
// DOMPurify fjerner alt som kan kjøre kode, og beholder vanlig HTML, klasser og lenker.
export function renderMarkdown(source: string): string {
  const html = md.render(fencedDivsToHtml(source))
  return DOMPurify.sanitize(html)
}
