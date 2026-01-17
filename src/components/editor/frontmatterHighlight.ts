import type { Text } from '@codemirror/state';
import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, type DecorationSet, type EditorView, type ViewUpdate, ViewPlugin } from '@codemirror/view';

const frontmatterLine = Decoration.line({ class: 'cm-frontmatter' });
const delimiterPattern = /^---\s*$/;

function findFrontmatterRange(doc: Text) {
  if (doc.lines < 2) return null;
  const firstLine = doc.line(1);
  if (!delimiterPattern.test(firstLine.text)) return null;

  for (let lineNumber = 2; lineNumber <= doc.lines; lineNumber += 1) {
    const line = doc.line(lineNumber);
    if (delimiterPattern.test(line.text)) {
      return { startLine: 1, endLine: lineNumber };
    }
  }

  return null;
}

function buildDecorations(view: EditorView): DecorationSet {
  const range = findFrontmatterRange(view.state.doc);
  if (!range) return Decoration.none;

  const builder = new RangeSetBuilder<Decoration>();
  for (let lineNumber = range.startLine; lineNumber <= range.endLine; lineNumber += 1) {
    const line = view.state.doc.line(lineNumber);
    builder.add(line.from, line.from, frontmatterLine);
  }
  return builder.finish();
}

export const frontmatterHighlight = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (value) => value.decorations,
  }
);
