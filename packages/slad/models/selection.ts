import { editorPathsAreEqual, EditorPath } from './path';

export interface EditorSelection {
  readonly anchor: EditorPath;
  readonly focus: EditorPath;
}

export function editorSelectionIsCollapsed(
  selection: EditorSelection,
): boolean {
  return editorPathsAreEqual(selection.anchor, selection.focus);
}

export function editorSelectionsAreEqual(
  selection1: EditorSelection,
  selection2: EditorSelection,
): boolean {
  if (selection1 === selection2) return true;
  return (
    editorPathsAreEqual(selection1.anchor, selection2.anchor) &&
    editorPathsAreEqual(selection1.focus, selection2.focus)
  );
}
