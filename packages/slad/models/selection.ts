import invariant from 'tiny-invariant';
import { pipe } from 'fp-ts/lib/pipeable';
import { Predicate, Endomorphism } from 'fp-ts/lib/function';
import {
  editorPathsAreEqual,
  EditorPath,
  NodesEditorPathsMap,
  editorPathsAreForward,
  movePath,
  invariantParentPath,
} from './path';

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
// Range is technically forward Selection. Having a special type for that,
// like DOM Range with start and end props, would complicate API I suppose.
// For example, isCollapsed, should it accept selection, range, or both?
// I suppose forward and backward direction should be an implementation detail.
// I don't think we have to optimize functions via explicit Range argument,
// because comparing paths is super fast compared to rendering itself.
// Also, we don't support multiple ranges, because the only browser supporting
// them is Firefox.

/**
 * Forward selection is not flipped aka the focus in not before the anchor.
 */
export const editorSelectionIsForward: Predicate<EditorSelection> = selection =>
  editorPathsAreForward(selection.anchor, selection.focus);

/**
 * Range is forward Selection. It ensures the focus is not before the anchor.
 */
export function editorSelectionAsRange(
  selection: EditorSelection,
): EditorSelection {
  if (editorSelectionIsForward(selection)) return selection;
  const { anchor: focus, focus: anchor } = selection;
  return { anchor, focus };
}

export const editorSelectionIsCollapsed: Predicate<
  EditorSelection
> = selection => editorPathsAreEqual(selection.anchor, selection.focus);

// TODO: Compare structures.
// https://gcanti.github.io/fp-ts/recipes/equality.html
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

export function invariantEditorSelectionsAreEqual(
  selection1: EditorSelection | null,
  selection2: EditorSelection | null,
): boolean {
  invariant(
    editorSelectionsAreEqual(selection1, selection2),
    'EditorSelections are not equal.',
  );
  return true;
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

export function moveEditorSelectionAnchor(
  offset: number,
): Endomorphism<EditorSelection> {
  return selection => {
    return {
      ...selection,
      anchor: movePath(offset)(selection.anchor),
    };
  };
}

export function moveEditorSelectionFocus(
  offset: number,
): Endomorphism<EditorSelection> {
  return selection => {
    return {
      ...selection,
      focus: movePath(offset)(selection.focus),
    };
  };
}

export function moveEditorSelection(
  offset: number,
): Endomorphism<EditorSelection> {
  return selection =>
    pipe(
      selection,
      moveEditorSelectionAnchor(offset),
      moveEditorSelectionFocus(offset),
    );
}

export const collapseEditorSelectionToStart: Endomorphism<
  EditorSelection
> = selection => {
  if (editorSelectionIsCollapsed(selection)) return selection;
  const range = editorSelectionAsRange(selection);
  return { anchor: range.anchor, focus: range.anchor };
};

export const collapseEditorSelectionToEnd: Endomorphism<
  EditorSelection
> = selection => {
  if (editorSelectionIsCollapsed(selection)) return selection;
  const range = editorSelectionAsRange(selection);
  return { anchor: range.focus, focus: range.focus };
};

export function editorSelectionFromInputEvent(
  event: InputEvent,
  nodesEditorPathsMap: NodesEditorPathsMap,
): EditorSelection {
  // We get the first range only, because only Firefox supports multiple ranges.
  // @ts-ignore Outdated types.
  const range = event.getTargetRanges()[0] as Range;
  const selection = rangeToEditorSelection(range, nodesEditorPathsMap);
  // To make TS happy. Invariant throws anyway.
  if (!invariantEditorSelectionIsDefined(selection)) return selection as any;
  return selection;
}

/**
 * `{ anchor: [0, 0], focus: [0, 0] }` to `{ anchor: [0], focus: [0] }`
 */
export const editorSelectionOfParent: Endomorphism<
  EditorSelection
> = selection => {
  return {
    anchor: invariantParentPath(selection.anchor),
    focus: invariantParentPath(selection.focus),
  };
};

/**
 * `{ anchor: [0], focus: [0] }` to `{ anchor: [0, 0], focus: [0, 0] }`
 */
export function editorSelectionForChild(
  anchorLastIndex: number,
  focusLastIndex: number,
): Endomorphism<EditorSelection> {
  return selection => {
    return {
      anchor: selection.anchor.concat(anchorLastIndex),
      focus: selection.focus.concat(focusLastIndex),
    };
  };
}
