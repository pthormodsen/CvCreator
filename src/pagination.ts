// Omtrentlig sideinndeling av forhåndsvisningen, så brukeren ser hvor PDF-en brytes.
//
// På skjermen er arket én lang flate. I utskriften deles innholdet i A4-sider, og
// blokker med break-inside: avoid (en hel erfaring, en ferdighetsliste, et listepunkt)
// skyves til neste side hvis de ikke får plass. Alt under skyves da like mye ned.
// Vi simulerer det samme her, slik at linjene havner der utskriften faktisk bryter.

const PX_PER_MM = 96 / 25.4
const A4_WIDTH = 210 * PX_PER_MM
const A4_HEIGHT = 297 * PX_PER_MM

export type Pagination = {
  pages: number
  breaks: number[] // y-posisjon (px, uten zoom) der hver side slutter, målt fra toppen av arket
  moved: number // antall blokker som skyves til neste side
  sheetHeight: number // høyden arket bør ha for å se ut som `pages` hele sider
}

// Blokker som holdes samlet ved sideskift (samme som break-inside: avoid i themene)
const UNBREAKABLE = '.entry, dl, li'

type Block = { el: Element; top: number; bottom: number }

export function paginate(sheet: HTMLElement): Pagination | null {
  const sheetRect = sheet.getBoundingClientRect()
  if (sheetRect.width === 0) return null // skjult, f.eks. i en annen fane på mobil

  // Arket er alltid 210 mm bredt, så forholdet mellom målt og ekte bredde er zoomen
  const zoom = sheetRect.width / A4_WIDTH
  const style = getComputedStyle(sheet)
  const padTop = parseFloat(style.paddingTop)
  const padBottom = parseFloat(style.paddingBottom)
  const capacity = A4_HEIGHT - padTop - padBottom // plass til innhold på hver side

  // Skjermposisjon → px fra toppen av innholdet, uten zoom
  const toContent = (y: number) => (y - sheetRect.top) / zoom - padTop

  sheet.querySelectorAll('.crosses-page').forEach((el) => el.classList.remove('crosses-page'))

  // Sidebar-layout har to kolonner som brytes hver for seg. Ellers er hele CV-en én kolonne.
  const columns = [...sheet.querySelectorAll('.sidebar, .main')]
  if (columns.length === 0 && sheet.firstElementChild) columns.push(sheet.firstElementChild)

  let longest = { pages: 1, pushes: [] as number[], moved: 0 }
  for (const column of columns) {
    const result = simulateColumn(column, capacity, toContent)
    if (result.pages > longest.pages) longest = result
  }

  // Sidegrense k ligger ved k × capacity i utskriften. På skjermen ligger den høyere opp,
  // med summen av alt som er skjøvet ned før (og ved) den grensen.
  const breaks: number[] = []
  let pushedSoFar = 0
  for (let k = 1; k < longest.pages; k++) {
    pushedSoFar += longest.pushes[k] ?? 0
    breaks.push(padTop + k * capacity - pushedSoFar)
  }
  const totalPushed = longest.pushes.reduce((sum, p) => sum + (p ?? 0), 0)

  return {
    pages: longest.pages,
    breaks,
    moved: sheet.querySelectorAll('.crosses-page').length,
    sheetHeight: padTop + longest.pages * capacity - totalPushed + padBottom,
  }
}

function simulateColumn(column: Element, capacity: number, toContent: (y: number) => number) {
  const blocks = findBlocks(column, toContent)

  let push = 0 // hvor langt alt er skjøvet ned så langt
  const pushes: number[] = [] // pushes[k] = hvor mye som ble skjøvet over sidegrense k
  let moved = 0

  for (const block of blocks) {
    const top = block.top + push
    const bottom = block.bottom + push
    const pageEnd = (Math.floor(top / capacity) + 1) * capacity
    const fitsOnOnePage = block.bottom - block.top <= capacity

    // Krysser blokken sidegrensen? Da flyttes den (og alt under) til neste side.
    if (bottom > pageEnd + 1 && fitsOnOnePage) {
      const amount = pageEnd - top
      const k = Math.round(pageEnd / capacity)
      pushes[k] = (pushes[k] ?? 0) + amount
      push += amount
      moved++
      block.el.classList.add('crosses-page')
    }
  }

  const contentBottom = toContent(column.getBoundingClientRect().bottom) + push
  const pages = Math.max(1, Math.ceil((contentBottom - 1) / capacity))
  return { pages, pushes, moved }
}

function findBlocks(column: Element, toContent: (y: number) => number): Block[] {
  return (
    [...column.querySelectorAll(UNBREAKABLE)]
      // Bare de ytterste: et listepunkt inni en erfaring flyttes sammen med erfaringen
      .filter((el) => !el.parentElement?.closest(UNBREAKABLE))
      .map((el) => {
        const rect = el.getBoundingClientRect()
        let top = toContent(rect.top)
        // Seksjonstittelen (h2) har break-after: avoid, så den følger med første blokk
        const section = el.closest('section')
        if (section && section.querySelector(UNBREAKABLE) === el) {
          top = toContent(section.getBoundingClientRect().top)
        }
        return { el, top, bottom: toContent(rect.bottom) }
      })
      .sort((a, b) => a.top - b.top)
  )
}
