import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import bracketedSpans from 'markdown-it-bracketed-spans'
import deflist from 'markdown-it-deflist'
import { splitFrontMatter } from './settings'

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

// Bilder og andre ressurser fra nettet blokkeres. En .md-fil fra noen andre kunne ellers
// laste et bilde fra en fremmed server (og avsløre at CV-en ble åpnet). Bare innebygde
// data:image/-bilder er lov. Gjelder src, srcset og url(...) i style-attributter.
// (Lenker med href er greit: de åpnes bare når noen klikker.)
const DATA_IMAGE = /^\s*data:image\//i

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  const src = node.getAttribute('src')
  if (src !== null && !DATA_IMAGE.test(src)) node.removeAttribute('src')

  const style = node.getAttribute('style')
  if (style !== null) {
    const cleaned = style.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, _q, target: string) =>
      DATA_IMAGE.test(target) ? match : 'none',
    )
    // Fjern hele style-attributtet hvis noe fortsatt kan laste en ressurs: image-set(),
    // en url( uten slutt-parentes, eller CSS-escapes (\75rl) som kan skjule url(
    const withoutDataImages = cleaned.replace(/url\(\s*['"]?\s*data:image\/[^)]*\)/gi, '')
    if (style.includes('\\') || /(url|image|image-set|cross-fade)\s*\(/i.test(withoutDataImages)) {
      node.removeAttribute('style')
    } else {
      node.setAttribute('style', cleaned)
    }
  }
})

const PURIFY_OPTIONS = {
  USE_PROFILES: { html: true }, // ingen SVG/MathML (de kan lenke til eksterne ressurser)
  FORBID_TAGS: ['link', 'meta', 'base', 'audio', 'video', 'source', 'track', 'picture', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['srcset', 'poster', 'background', 'lowsrc', 'dynsrc', 'ping', 'action', 'formaction'],
}

// Rens HTML-en før den vises. html: true trengs fordi fencedDivsToHtml lager <div>-tagger,
// men det betyr også at en .md-fil fra noen andre kan inneholde <img onerror="..."> eller
// <script>. markdown-it-attrs slipper i tillegg gjennom vilkårlige attributter ({onclick=...}).
// DOMPurify fjerner alt som kan kjøre kode eller laste noe fra nettet, og beholder vanlig
// HTML, klasser og lenker. Front matter (innstillingene øverst) fjernes her, så den aldri
// havner i CV-en.
export function renderMarkdown(source: string): string {
  const { body } = splitFrontMatter(source)
  const html = md.render(fencedDivsToHtml(body))
  return DOMPurify.sanitize(html, PURIFY_OPTIONS)
}
