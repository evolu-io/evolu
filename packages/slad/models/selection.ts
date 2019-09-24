import invariant from 'tiny-invariant';
import produce from 'immer';
import { editorPathsAreEqual, EditorPath, NodesEditorPathsMap } from './path';
import { pipe } from '../pipe';

/**
 * Like browser Selection, but with EditorPath for the anchor and the focus.
 * I suppose that's all we need. Browser Range is superfluous abstraction for
 * pure model. Also, we don't support multiple selections, because the only browser
 * supporting them is Firefox.
 */
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

export function selectionToEditorSelection(
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

export function rangeToEditorSelection(
  range: Range | null,
  nodesEditorPathsMap: NodesEditorPathsMap,
): EditorSelection | null {
  if (range == null) return null;
  const { startContainer, startOffset, endContainer, endOffset } = range;
  const anchorPath = nodesEditorPathsMap.get(startContainer);
  const focusPath = nodesEditorPathsMap.get(endContainer);
  if (!anchorPath || !focusPath) return null;
  return {
    anchor: [...anchorPath, startOffset],
    focus: [...focusPath, endOffset],
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

export const moveAnchor = (offset: number) => (selection: EditorSelection) =>
  produce(selection, draft => {
    draft.anchor[draft.anchor.length - 1] += offset;
  });

export const moveFocus = (offset: number) => (selection: EditorSelection) =>
  produce(selection, draft => {
    draft.focus[draft.focus.length - 1] += offset;
  });

export const move = (offset: number) => (
  selection: EditorSelection,
): EditorSelection =>
  pipe(
    selection,
    moveAnchor(offset),
    moveFocus(offset),
  );
