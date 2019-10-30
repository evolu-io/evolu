import { sequenceT, sequenceS } from 'fp-ts/lib/Apply';
import { init, snoc, isNonEmpty } from 'fp-ts/lib/Array';
import { Eq, getStructEq } from 'fp-ts/lib/Eq';
import { Endomorphism, Predicate } from 'fp-ts/lib/function';
import { chain, none, Option, option, some, filter } from 'fp-ts/lib/Option';
import { geq } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import { Selection, Range, GetPathByDOMNode } from '../types';
import { getDOMRangeFromInputEvent } from './dom';
import { byDirection, eqPath, movePath } from './path';
import { DOMSelection, DOMRange } from '../types/dom';

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
 * `{ anchor: [1, 2], focus: [1, 3] }` to `{ anchor: [1], focus: [1] }`
 */
export const initSelection = (selection: Selection): Option<Selection> =>
  sequenceS(option)({
    anchor: pipe(
      init(selection.anchor),
      filter(isNonEmpty),
    ),
    focus: pipe(
      init(selection.focus),
      filter(isNonEmpty),
    ),
  });

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
