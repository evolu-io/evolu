import { snoc, init } from 'fp-ts/lib/Array';
import { Eq, getStructEq } from 'fp-ts/lib/Eq';
import { Endomorphism, Predicate } from 'fp-ts/lib/function';
import {
  none,
  Option,
  some,
  chain,
  toNullable,
  fromNullable,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import {
  editorPathsAreForward,
  eqEditorPath,
  movePath,
  GetEditorPathByNode,
  EditorPath,
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
> = selection => eqEditorPath.equals(selection.anchor, selection.focus);

export const eqEditorSelection: Eq<EditorSelection> = getStructEq({
  anchor: eqEditorPath,
  focus: eqEditorPath,
});

export function selectionToEditorSelection(
  getEditorPathByNode: GetEditorPathByNode,
): (selection: Selection) => Option<EditorSelection> {
  return selection => {
    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
    if (!anchorNode || !focusNode) return none;
    const anchorPath = toNullable(getEditorPathByNode(anchorNode));
    const focusPath = toNullable(getEditorPathByNode(focusNode));
    if (!anchorPath || !focusPath) return none;
    return some({
      anchor: snoc(anchorPath, anchorOffset),
      focus: snoc(focusPath, focusOffset),
    });
  };
}

export function rangeToEditorSelection(
  getEditorPathByNode: GetEditorPathByNode,
): (range: Range) => Option<EditorSelection> {
  return range => {
    const { startContainer, startOffset, endContainer, endOffset } = range;
    // How to do it without toNullable?
    const anchorPath = toNullable(getEditorPathByNode(startContainer));
    const focusPath = toNullable(getEditorPathByNode(endContainer));
    if (!anchorPath || !focusPath) return none;
    return some({
      anchor: snoc(anchorPath, startOffset),
      focus: snoc(focusPath, endOffset),
    });
  };
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

export function rangeFromInputEvent(event: InputEvent): Option<Range> {
  // The first range only because only Firefox supports multiple ranges.
  // @ts-ignore Outdated types.
  return fromNullable(event.getTargetRanges()[0]);
}

export function editorSelectionFromInputEvent(
  getEditorPathByNode: GetEditorPathByNode,
): (event: InputEvent) => Option<EditorSelection> {
  return event => {
    return pipe(
      rangeFromInputEvent(event),
      chain(rangeToEditorSelection(getEditorPathByNode)),
    );
  };
}

/**
 * `{ anchor: [0, 0], focus: [0, 0] }` to `{ anchor: [0], focus: [0] }`
 */
export function editorSelectionOfParent(
  selection: EditorSelection,
): Option<EditorSelection> {
  const anchor = toNullable(init(selection.anchor));
  const focus = toNullable(init(selection.focus));
  if (!anchor || !focus) return none;
  return some({ anchor, focus });
}

/**
 * `{ anchor: [0], focus: [0] }` to `{ anchor: [0, 0], focus: [0, 0] }`
 */
export function editorSelectionForChild(
  anchorLastIndex: number,
  focusLastIndex: number,
): Endomorphism<EditorSelection> {
  return selection => {
    return {
      anchor: snoc(selection.anchor, anchorLastIndex),
      focus: snoc(selection.focus, focusLastIndex),
    };
  };
}
