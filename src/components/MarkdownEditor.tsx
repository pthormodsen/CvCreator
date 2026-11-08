import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { EditorState, RangeSetBuilder, StateField, type Text } from '@codemirror/state'
import { Decoration, EditorView, keymap, placeholder, type DecorationSet } from '@codemirror/view'
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

// Front matter (innstillingene mellom --- øverst) vises dempet, så den ikke konkurrerer
// med CV-teksten. Vi markerer linjene med klassen cm-frontmatter (se editorTheme under).
const frontMatterLine = Decoration.line({ class: 'cm-frontmatter' })

function frontMatterDecorations(doc: Text): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const { frontMatter, body } = splitFrontMatter(doc.toString())
  if (frontMatter !== null) {
    const end = doc.length - body.length // der front matter slutter
    const lastLine = doc.lineAt(Math.max(0, end - 1)).number
    for (let n = 1; n <= lastLine; n++) builder.add(doc.line(n).from, doc.line(n).from, frontMatterLine)
  }
  return builder.finish()
}

const frontMatterField = StateField.define<DecorationSet>({
  create: (state) => frontMatterDecorations(state.doc),
  update: (decorations, tr) => (tr.docChanged ? frontMatterDecorations(tr.state.doc) : decorations),
  provide: (field) => EditorView.decorations.from(field),
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
  // Dempet front matter: grå og uten fet/farget markdown-utheving inni
  '.cm-frontmatter, .cm-frontmatter *': { color: 'var(--color-text-muted) !important', fontWeight: '400 !important' },
  '.cm-frontmatter': { backgroundColor: 'var(--color-bg)' },
})

// Det andre komponenter kan be editoren om (Customize-panelet bruker undo/redo,
// så Cmd+Z virker der også, med samme historikk som editoren)
export type EditorController = { undo: () => void; redo: () => void }

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
          frontMatterField,
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
  }))

  return <div className={hidden ? 'editor-host is-hidden' : 'editor-host'} ref={hostRef} />
}
