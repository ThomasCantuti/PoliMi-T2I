import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { EditorView, keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting, indentUnit } from '@codemirror/language';
import { indentMore, indentLess } from '@codemirror/commands';
import { tags as t } from '@lezer/highlight';

// Colors come from CSS variables, so the editor follows the light/dark theme.
const theme = EditorView.theme({
  '&': { backgroundColor: 'var(--panel)', color: 'var(--text)' },
  '.cm-content': { caretColor: 'var(--text)', padding: '10px 0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--text)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'color-mix(in oklab, var(--accent) 28%, transparent) !important' },
  '.cm-activeLine': { backgroundColor: 'color-mix(in oklab, var(--panel-3) 55%, transparent)' },
  '.cm-gutters': { backgroundColor: 'var(--panel)', color: 'var(--muted)', border: 'none', paddingLeft: '6px' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--text-2)' },
  '.cm-matchingBracket': { backgroundColor: 'var(--accent-soft)', outline: '1px solid var(--accent)' },
  '.cm-tooltip': { backgroundColor: 'var(--panel-2)', border: '1px solid var(--border)', color: 'var(--text)' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'var(--accent)', color: '#fff' },
  '.cm-foldPlaceholder': { backgroundColor: 'var(--panel-3)', border: 'none', color: 'var(--muted)' },
});

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword], color: 'var(--accent-2)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--ok)' },
  { tag: t.comment, color: 'var(--muted)', fontStyle: 'italic' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--warn)' },
  { tag: [t.function(t.definition(t.variableName)), t.function(t.variableName)], color: 'var(--info)' },
  { tag: [t.className, t.definition(t.className)], color: '#f0883e' },
  { tag: t.propertyName, color: 'var(--text-2)' },
  { tag: t.self, color: 'var(--v-min)' },
]);

export function CodeEditor({ value, onChange, onRun }: { value: string; onChange: (v: string) => void; onRun: () => void }) {
  const extensions = useMemo(() => [
    python(), theme, syntaxHighlighting(highlight), indentUnit.of('    '), EditorView.lineWrapping,
    Prec.highest(keymap.of([
      { key: 'Mod-Enter', run: () => { onRun(); return true; } },
      { key: 'Tab', run: indentMore, shift: indentLess },
    ])),
  ], [onRun]);
  return (
    <CodeMirror value={value} onChange={onChange} extensions={extensions} theme="none" height="100%"
      className="h-full" basicSetup={{ foldGutter: false, highlightActiveLine: true, tabSize: 4, autocompletion: true }} />
  );
}
