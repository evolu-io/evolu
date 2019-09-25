import invariant from 'tiny-invariant';
import produce from 'immer';
import {
  editorPathsAreEqual,
  EditorPath,
  NodesEditorPathsMap,
  editorPathsAreForward,
} from './path';
import { pipe } from '../pipe';

/**
 * Like browser Selection, but with EditorPath for the anchor and the focus.
 * The anchor is where the selection starts and the focus is where the selection ends.
 * Therefore, EditorSelection can be forward or backward.
 */
export interface EditorSelection {
  readonly anchor: EditorPath;
  readonly focus: EditorPath;
}

// Why not Range type?
// Range is technically forwarded Selection. Having a special type for that,
// like DOM Range with start and end props, would complicate API I suppose.
// For example, isCollapsed, should it accept selection, range, or both?
// I suppose forward and backward orientation should be an implementation detail.
// I don't think we have to optimize functions via explicit Range argument,
// because comparing paths is super fast compared to rendering itself.
// Also, we don't support multiple ranges, because the only browser supporting
// them is Firefox.

/**
 * Forward selection is not flipped aka the focus in not before the anchor.
 */
export function editorSelectionIsForward(selection: EditorSelection) {
  return editorPathsAreForward(selection.anchor, selection.focus);
}

/**
 * Range is forward Selection.
 */
export function editorSelectionAsRange(
  selection: EditorSelection,
): EditorSelection {
  if (editorSelectionIsForward(selection)) return selection;
  const { anchor: focus, focus: anchor } = selection;
  return { anchor, focus };
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

export function moveSelectionAnchor(offset: number) {
  return (selection: EditorSelection) =>
    produce(selection, draft => {
      draft.anchor[draft.anchor.length - 1] += offset;
    });
}

export function moveSelectionFocus(offset: number) {
  return (selection: EditorSelection) =>
    produce(selection, draft => {
      draft.focus[draft.focus.length - 1] += offset;
    });
}

export function moveSelection(offset: number) {
  return (selection: EditorSelection): EditorSelection =>
    pipe(
      selection,
      moveSelectionAnchor(offset),
      moveSelectionFocus(offset),
    );
}
