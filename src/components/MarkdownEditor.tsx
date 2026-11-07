import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { HighlightStyle, LanguageSupport, syntaxHighlighting } from '@codemirror/language'
import { commonmarkLanguage } from '@codemirror/lang-markdown'
import { tags } from '@lezer/highlight'

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
