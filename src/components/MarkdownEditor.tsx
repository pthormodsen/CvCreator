import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { EditorSelection, EditorState, StateEffect, StateField, type Text } from '@codemirror/state'
import { Decoration, EditorView, WidgetType, keymap, placeholder, type DecorationSet } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, isolateHistory, redo, undo } from '@codemirror/commands'
import { HighlightStyle, LanguageSupport, syntaxHighlighting } from '@codemirror/language'
import { commonmarkLanguage } from '@codemirror/lang-markdown'
import { tags } from '@lezer/highlight'
import { splitFrontMatter } from '../settings'
import { minimalChange } from '../textDiff'

// Fargene for markdown. lang-markdown gir hver del av teksten en "tag",
// og her bestemmer vi hvordan hver tag ser ut. Fargene er tokens fra tokens.css,
// så de følger lys og mørk modus.
const markdownHighlight = HighlightStyle.define([
  // Overskrifter: tydelige
  { tag: [tags.heading1, tags.heading2, tags.heading3, tags.heading4], color: 'var(--color-md-heading)', fontWeight: '600' },
  // **fet** og *kursiv*
  { tag: tags.strong, fontWeight: '600' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  // [lenketekst] i blått, (https://...) i dempet grått, så kontaktlinjene blir roligere
  { tag: tags.link, color: 'var(--color-md-link)' },
  { tag: tags.url, color: 'var(--color-md-url)' },
  // Selve markdown-tegnene: # ** [ ] ( ) - \ og lignende
  { tag: tags.processingInstruction, color: 'var(--color-md-mark)' },
  { tag: tags.monospace, color: 'var(--color-md-code)' },
])

// ---------- Front matter som «⚙ Settings»-pille ----------
//
// Innstillingene mellom --- øverst er foldet sammen til én linje som standard, så CV-teksten
// står først. Et klikk på pillen viser linjene igjen (dempet), et nytt klikk folder dem.

const toggleSettings = StateEffect.define<boolean>() // true = vis linjene

type SettingsState = { expanded: boolean; end: number; decorations: DecorationSet }

// Kort sammendrag til pillen: «theme: modern +3»
function settingsSummary(frontMatter: string): string {
  const keys = [...frontMatter.matchAll(/^([A-Za-z][\w-]*):[ \t]*(.*)$/gm)]
  if (keys.length === 0) return 'none yet'
  const theme = keys.find((k) => k[1] === 'theme')
  const first = theme ?? keys[0]
  const value = first[2].trim()
  const label = value && value.length <= 24 ? `${first[1]}: ${value}` : first[1]
  return keys.length > 1 ? `${label}  +${keys.length - 1}` : label
}

class SettingsPill extends WidgetType {
  readonly summary: string
  readonly expanded: boolean
  constructor(summary: string, expanded: boolean) {
    super()
    this.summary = summary
    this.expanded = expanded
  }
  eq(other: SettingsPill) {
    return other.summary === this.summary && other.expanded === this.expanded
  }
  toDOM(view: EditorView) {
    const line = document.createElement('div')
    line.className = 'cm-settings-pill-line'
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'cm-settings-pill'
    button.setAttribute('aria-expanded', String(this.expanded))
    button.title = this.expanded ? 'Hide the settings lines' : 'Show the settings lines (front matter)'
    button.innerHTML =
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>` +
      `<strong>Settings</strong><span class="cm-settings-summary"></span>` +
      `<svg class="cm-settings-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`
    button.querySelector('.cm-settings-summary')!.textContent = `· ${this.summary}`
    button.addEventListener('mousedown', (e) => e.preventDefault()) // ikke flytt markøren
    button.addEventListener('click', () => view.dispatch({ effects: toggleSettings.of(!this.expanded) }))
    line.append(button)
    return line
  }
  ignoreEvent() {
    return true // editoren skal ikke reagere på klikk i pillen
  }
}

const frontMatterLine = Decoration.line({ class: 'cm-frontmatter' })

function buildSettings(doc: Text, expanded: boolean): SettingsState {
  const { frontMatter, body } = splitFrontMatter(doc.toString())
  if (frontMatter === null) return { expanded, end: -1, decorations: Decoration.none }
  const end = doc.lineAt(Math.max(0, doc.length - body.length - 1)).to // slutten av linjen med ---
  const pill = new SettingsPill(settingsSummary(frontMatter), expanded)
  if (!expanded) {
    return { expanded, end, decorations: Decoration.set([Decoration.replace({ widget: pill, block: true }).range(0, end)]) }
  }
  const ranges = [Decoration.widget({ widget: pill, block: true, side: -1 }).range(0)]
  for (let n = 1; n <= doc.lineAt(end).number; n++) ranges.push(frontMatterLine.range(doc.line(n).from))
  return { expanded, end, decorations: Decoration.set(ranges, true) }
}

const settingsField = StateField.define<SettingsState>({
  create: (state) => buildSettings(state.doc, false),
  update(value, tr) {
    let expanded = value.expanded
    for (const effect of tr.effects) if (effect.is(toggleSettings)) expanded = effect.value
    if (!tr.docChanged && expanded === value.expanded) return value
    return buildSettings(tr.state.doc, expanded)
  },
  provide: (field) => [
    EditorView.decorations.from(field, (value) => value.decorations),
    // Markøren hopper over den foldede blokken i stedet for å havne inni den
    EditorView.atomicRanges.of((view) => {
      const value = view.state.field(field)
      return value.expanded ? Decoration.none : value.decorations
    }),
  ],
})

// En tom markør i starten av den foldede blokken ville skrevet tekst foran ---, og da
// sluttet front matter å fungere. Flytt den til første linje etter blokken.
const keepCursorOutOfSettings = EditorState.transactionFilter.of((tr) => {
  if (!tr.selection) return tr
  const value = tr.state.field(settingsField, false)
  const after = tr.docChanged ? buildSettings(tr.newDoc, value?.expanded ?? false) : value
  if (!after || after.expanded || after.end < 0) return tr
  const main = tr.selection.main
  if (!main.empty || main.head > after.end) return tr
  const target = Math.min(after.end + 1, tr.newDoc.length)
  return [tr, { selection: EditorSelection.cursor(target), sequential: true }]
})

// Utseendet på editoren: samme skrift, linjehøyde og luft som textarea-en hadde
const editorTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '13.5px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.7',
  },
  '.cm-content': { padding: '16px 0 24px', caretColor: 'var(--color-accent)' },
  '.cm-cursor': { borderLeftColor: 'var(--color-accent)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--color-accent-soft) !important',
  },
  // --editor-gutter settes i index.css, så luften kan være mindre på mobil
  '.cm-line': { padding: '0 var(--editor-gutter, 24px)' },
  '.cm-placeholder': { color: 'var(--color-text-subtle)' },
  // Utbrettet front matter: dempet og uten fet/farget markdown-utheving inni
  '.cm-frontmatter, .cm-frontmatter *': { color: 'var(--color-text-muted) !important', fontWeight: '400 !important' },
  '.cm-frontmatter': { backgroundColor: 'var(--color-bg)' },
})

// Det andre komponenter kan be editoren om (Customize-panelet bruker undo/redo,
// så Cmd+Z virker der også, med samme historikk som editoren)
export type EditorController = { undo: () => void; redo: () => void; showSettings: () => void }

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
  labelledBy: string // id-en til overskriften, for skjermlesere
  hidden?: boolean // skjult mens Customize-fanen er åpen (beholdes for å huske historikken)
  ref?: Ref<EditorController>
}

export function MarkdownEditor({ value, onChange, labelledBy, hidden, ref }: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  // CodeMirror lages bare én gang, men onChange kan være en ny funksjon hver render.
  // Vi holder den nyeste i en ref, så editoren alltid kaller riktig funksjon.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  // Lag editoren når komponenten vises, og rydd opp når den forsvinner.
  // CodeMirror styrer sin egen DOM, så React skal ikke røre innholdet i hostRef.
  const initialValue = useRef(value)
  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current!,
      state: EditorState.create({
        doc: initialValue.current,
        // Start markøren på første linje etter innstillingene (de er foldet sammen)
        selection: EditorSelection.cursor(
          initialValue.current.length - splitFrontMatter(initialValue.current).body.length,
        ),
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          // Vanlig CommonMark direkte i stedet for markdown():
          // - markdown() tar med støtte for HTML inni markdown, og drar inn HTML-, CSS- og
          //   JavaScript-tolkere (~100 KB vi ikke trenger)
          // - GitHub-varianten gjør e-postadresser i [lenketekst] om til autolenker,
          //   så de fikk URL-fargen i stedet for lenkefargen
          new LanguageSupport(commonmarkLanguage),
          syntaxHighlighting(markdownHighlight),
          settingsField,
          keepCursorOutOfSettings,
          editorTheme,
          EditorView.lineWrapping,
          placeholder('Write your CV in Markdown…'),
          EditorView.contentAttributes.of({ 'aria-labelledby': labelledBy, spellcheck: 'false' }),
          // Send endringer opp til App
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString())
          }),
        ],
      }),
    })
    viewRef.current = view
    return () => view.destroy()
  }, [labelledBy])

  // Når teksten endres utenfra (Open, Reset, Customize), send bare den delen som er ny.
  // Da blir markøren stående der den var, og endringen kan angres med Cmd+Z.
  //
  // Angre-steg: endringer på samme linje innen ett sekund (en slider som dras) blir ett steg.
  // Alt annet (en annen innstilling, «Reset to theme defaults») blir sitt eget steg, uansett
  // hvor raskt det skjer etter forrige endring.
  const lastExternal = useRef<{ line: number; time: number } | null>(null)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const change = minimalChange(view.state.doc.toString(), value)
    if (!change) return
    const line = view.state.doc.lineAt(change.from).number
    const now = Date.now()
    const previous = lastExternal.current
    const sameGroup = previous !== null && previous.line === line && now - previous.time < 1000
    view.dispatch({ changes: change, annotations: sameGroup ? [] : [isolateHistory.of('before')] })
    lastExternal.current = { line, time: now }
  }, [value])

  useImperativeHandle(ref, () => ({
    undo: () => viewRef.current && undo(viewRef.current),
    redo: () => viewRef.current && redo(viewRef.current),
    showSettings: () => viewRef.current?.dispatch({ effects: toggleSettings.of(true) }),
  }))

  return <div className={hidden ? 'editor-host is-hidden' : 'editor-host'} ref={hostRef} />
}
