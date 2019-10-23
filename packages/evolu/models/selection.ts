import { sequenceT } from 'fp-ts/lib/Apply';
import { init, snoc } from 'fp-ts/lib/Array';
import { Eq, getStructEq } from 'fp-ts/lib/Eq';
import { Endomorphism, Predicate } from 'fp-ts/lib/function';
import { chain, none, Option, option, some } from 'fp-ts/lib/Option';
import { geq } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import {
  DOMRange,
  DOMSelection,
  getDOMRangeFromInputEvent,
  GetPathByDOMNode,
} from './dom';
import { byDirection, eqPath, movePath, Path } from './path';
import { Range } from './range';

/**
 * Like DOM Selection, but with Path for the anchor and the focus.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export interface Selection {
  readonly anchor: Path;
  readonly focus: Path;
}

/**
 * The focus in not before the anchor.
 */
export const isForwardSelection: Predicate<Selection> = selection =>
  geq(byDirection)(selection.anchor, selection.focus);

export const mapSelectionToRange = (selection: Selection): Range =>
  isForwardSelection(selection)
    ? { start: selection.anchor, end: selection.focus }
    : { start: selection.focus, end: selection.anchor };

export const isCollapsedSelection: Predicate<Selection> = selection =>
  eqPath.equals(selection.anchor, selection.focus);

export const eqSelection: Eq<Selection> = getStructEq({
  anchor: eqPath,
  focus: eqPath,
});

export const mapDOMSelectionToSelection = (
  getPathByDOMNode: GetPathByDOMNode,
): ((selection: DOMSelection) => Option<Selection>) => ({
  anchorNode,
  anchorOffset,
  focusNode,
  focusOffset,
}) =>
  pipe(
    sequenceT(option)(
      anchorNode ? getPathByDOMNode(anchorNode) : none,
      focusNode ? getPathByDOMNode(focusNode) : none,
    ),
    chain(([anchorPath, focusPath]) =>
      some({
        anchor: snoc(anchorPath, anchorOffset),
        focus: snoc(focusPath, focusOffset),
      }),
    ),
  );

export const mapDOMRangeToSelection = (
  getPathByDOMNode: GetPathByDOMNode,
): ((range: DOMRange) => Option<Selection>) => ({
  startContainer,
  startOffset,
  endContainer,
  endOffset,
}) =>
  pipe(
    sequenceT(option)(
      getPathByDOMNode(startContainer),
      getPathByDOMNode(endContainer),
    ),
    chain(([anchorPath, focusPath]) =>
      some({
        anchor: snoc(anchorPath, startOffset),
        focus: snoc(focusPath, endOffset),
      }),
    ),
  );

export const moveSelectionAnchor = (
  offset: number,
): Endomorphism<Selection> => selection => ({
  ...selection,
  anchor: movePath(offset)(selection.anchor),
});

export const moveSelectionFocus = (
  offset: number,
): Endomorphism<Selection> => selection => ({
  ...selection,
  focus: movePath(offset)(selection.focus),
});

export const moveSelection = (
  offset: number,
): Endomorphism<Selection> => selection =>
  pipe(
    selection,
    moveSelectionAnchor(offset),
    moveSelectionFocus(offset),
  );

export const collapseSelectionToStart: Endomorphism<Selection> = selection => {
  if (isCollapsedSelection(selection)) return selection;
  const range = mapSelectionToRange(selection);
  return { anchor: range.start, focus: range.start };
};

export const collapseSelectionToEnd: Endomorphism<Selection> = selection => {
  if (isCollapsedSelection(selection)) return selection;
  const range = mapSelectionToRange(selection);
  return { anchor: range.end, focus: range.end };
};

export const getSelectionFromInputEvent = (
  getPathByDOMNode: GetPathByDOMNode,
): ((event: InputEvent) => Option<Selection>) => event =>
  pipe(
    getDOMRangeFromInputEvent(event),
    chain(mapDOMRangeToSelection(getPathByDOMNode)),
  );

/**
 * `{ anchor: [0, 0], focus: [0, 0] }` to `{ anchor: [0], focus: [0] }`
 */
export const initSelection = (selection: Selection): Option<Selection> =>
  pipe(
    sequenceT(option)(init(selection.anchor), init(selection.focus)),
    chain(([anchor, focus]) => some({ anchor, focus })),
  );

/**
 * `{ anchor: [0], focus: [0] }` to `{ anchor: [0, 0], focus: [0, 0] }`
 */
export const snocSelection = (
  selection: Selection,
  anchorLastIndex: number,
  focusLastIndex: number,
): Selection => ({
  anchor: snoc(selection.anchor, anchorLastIndex),
  focus: snoc(selection.focus, focusLastIndex),
});
