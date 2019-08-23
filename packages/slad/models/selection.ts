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
  selection1: EditorSelection | undefined,
  selection2: EditorSelection | undefined,
): boolean {
  if (selection1 === selection2) return true;
  if (selection1 == null || selection2 == null) return false;
  return (
    editorPathsAreEqual(selection1.anchor, selection2.anchor) &&
    editorPathsAreEqual(selection1.focus, selection2.focus)
  );
}

export function mapSelectionToEditorSelection(
  selection: Selection | undefined,
  nodesEditorPathsMap: NodesEditorPathsMap,
): EditorSelection | undefined {
  if (selection == null) return undefined;
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  if (!anchorNode || !focusNode) return undefined;
  const anchorPath = nodesEditorPathsMap.get(anchorNode as Node);
  const focusPath = nodesEditorPathsMap.get(focusNode as Node);
  if (!anchorPath || !focusPath) return undefined;
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
