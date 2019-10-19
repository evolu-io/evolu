import { sequenceT } from 'fp-ts/lib/Apply';
import { init, snoc } from 'fp-ts/lib/Array';
import { Eq, getStructEq } from 'fp-ts/lib/Eq';
import { Endomorphism, Predicate } from 'fp-ts/lib/function';
import {
  chain,
  fromNullable,
  none,
  Option,
  option,
  some,
} from 'fp-ts/lib/Option';
import { geq } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import {
  byDirection,
  EditorPath,
  eqEditorPath,
  GetEditorPathByNode,
  movePath,
} from './path';

/**
 * Like browser Selection, but with EditorPath for the anchor and the focus.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
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
  geq(byDirection)(selection.anchor, selection.focus);

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
  return ({ anchorNode, anchorOffset, focusNode, focusOffset }) =>
    pipe(
      sequenceT(option)(
        anchorNode ? getEditorPathByNode(anchorNode) : none,
        focusNode ? getEditorPathByNode(focusNode) : none,
      ),
      chain(([anchorPath, focusPath]) =>
        some({
          anchor: snoc(anchorPath, anchorOffset),
          focus: snoc(focusPath, focusOffset),
        }),
      ),
    );
}

export function rangeToEditorSelection(
  getEditorPathByNode: GetEditorPathByNode,
): (range: Range) => Option<EditorSelection> {
  return ({ startContainer, startOffset, endContainer, endOffset }) =>
    pipe(
      sequenceT(option)(
        getEditorPathByNode(startContainer),
        getEditorPathByNode(endContainer),
      ),
      chain(([anchorPath, focusPath]) =>
        some({
          anchor: snoc(anchorPath, startOffset),
          focus: snoc(focusPath, endOffset),
        }),
      ),
    );
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
  return pipe(
    sequenceT(option)(init(selection.anchor), init(selection.focus)),
    chain(([anchor, focus]) => some({ anchor, focus })),
  );
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
