import { useEffect, useRef } from 'react'
import { EditorState, RangeSetBuilder, StateField, type Text } from '@codemirror/state'
import { Decoration, EditorView, keymap, placeholder, type DecorationSet } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { HighlightStyle, LanguageSupport, syntaxHighlighting } from '@codemirror/language'
import { commonmarkLanguage } from '@codemirror/lang-markdown'
import { tags } from '@lezer/highlight'
import { splitFrontMatter } from '../settings'

// Fargene for markdown. lang-markdown gir hver del av teksten en "tag",
// og her bestemmer vi hvordan hver tag ser ut.
const markdownHighlight = HighlightStyle.define([
  // Overskrifter: tydelige
  { tag: [tags.heading1, tags.heading2, tags.heading3, tags.heading4], color: '#0b3d91', fontWeight: '700' },
  // **fet** og *kursiv*
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  // [lenketekst] i blått, (https://...) i dempet grått, så kontaktlinjene blir roligere
  { tag: tags.link, color: '#0550ae' },
  { tag: tags.url, color: '#8c959f' },
  // Selve markdown-tegnene: # ** [ ] ( ) - \ og lignende
  { tag: tags.processingInstruction, color: '#8c959f' },
  { tag: tags.monospace, color: '#953800' },
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
  '&': { height: '100%', fontSize: '14px', backgroundColor: '#fafbfc', color: '#1f2328' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    lineHeight: '1.6',
  },
  '.cm-content': { padding: '20px 0', caretColor: '#1f2328' },
  // --editor-gutter settes i index.css, så luften kan være mindre på mobil
  '.cm-line': { padding: '0 var(--editor-gutter, 24px)' },
  '.cm-placeholder': { color: '#8c959f' },
  // Dempet front matter: grå og uten fet/farget markdown-utheving inni
  '.cm-frontmatter, .cm-frontmatter *': { color: '#8c959f !important', fontWeight: '400 !important' },
  '.cm-frontmatter': { backgroundColor: '#f2f4f6' },
})

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
  labelledBy: string // id-en til overskriften, for skjermlesere
}

export function MarkdownEditor({ value, onChange, labelledBy }: MarkdownEditorProps) {
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

  // Når teksten endres utenfra (Open, Reset), bytt innholdet i editoren
  useEffect(() => {
    const view = viewRef.current
    if (view && view.state.doc.toString() !== value) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
    }
  }, [value])

  return <div className="editor-host" ref={hostRef} />
}
