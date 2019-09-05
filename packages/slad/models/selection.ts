import invariant from 'tiny-invariant';
import { editorPathsAreEqual, EditorPath, NodesEditorPathsMap } from './path';

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
  selection1: EditorSelection | null,
  selection2: EditorSelection | null,
): boolean {
  if (selection1 === selection2) return true;
  if (selection1 == null || selection2 == null) return false;
  return (
    editorPathsAreEqual(selection1.anchor, selection2.anchor) &&
    editorPathsAreEqual(selection1.focus, selection2.focus)
  );
}

export function mapSelectionToEditorSelection(
  selection: Selection | null,
  nodesEditorPathsMap: NodesEditorPathsMap,
): EditorSelection | null {
  if (selection == null) return null;
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  if (!anchorNode || !focusNode) return null;
  const anchorPath = nodesEditorPathsMap.get(anchorNode as Node);
  const focusPath = nodesEditorPathsMap.get(focusNode as Node);
  if (!anchorPath || !focusPath) return null;
  return {
    anchor: [...anchorPath, anchorOffset],
    focus: [...focusPath, focusOffset],
  };
}

export function editorSelectionIsBackward(selection: EditorSelection): boolean {
  if (editorSelectionIsCollapsed(selection)) return false;
  return selection.anchor.some(
    (value, index) => value > selection.focus[index],
  );
}

export function invariantEditorSelectionIsDefined(
  selection: EditorSelection | null,
): selection is EditorSelection {
  invariant(selection != null, 'EditorSelection is not defined.');
  return true;
}

export function invariantEditorSelectionIsCollapsed(
  selection: EditorSelection,
): selection is EditorSelection {
  invariant(
    editorSelectionIsCollapsed(selection),
    'EditorSelection is not collapsed.',
  );
  return true;
}
