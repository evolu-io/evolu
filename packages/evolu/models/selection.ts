import { sequenceS, sequenceT } from 'fp-ts/lib/Apply';
import { init, isNonEmpty, snoc } from 'fp-ts/lib/Array';
import { Eq, getStructEq } from 'fp-ts/lib/Eq';
import { Endomorphism, Predicate } from 'fp-ts/lib/function';
import { geq } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import { IO } from 'fp-ts/lib/IO';
import { Option, chain, option, some, filter } from 'fp-ts/lib/Option';
import { GetPathByDOMNode, Range, Selection, NonEmptyPath } from '../types';
import { getDOMRangeFromInputEvent } from './dom';
import { byDirection, eqPath, movePath } from './path';

export const eqSelection: Eq<Selection> = getStructEq({
  anchor: eqPath,
  focus: eqPath,
});

/**
 * The focus in not before the anchor.
 */
export const isForward: Predicate<Selection> = selection =>
  geq(byDirection)(selection.anchor, selection.focus);

export const selectionToRange = (selection: Selection): Range =>
  isForward(selection)
    ? { start: selection.anchor, end: selection.focus }
    : { start: selection.focus, end: selection.anchor };

export const isCollapsed: Predicate<Selection> = selection =>
  eqPath.equals(selection.anchor, selection.focus);

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
  pipe(selection, moveSelectionAnchor(offset), moveSelectionFocus(offset));

export const collapseToStart: Endomorphism<Selection> = selection => {
  if (isCollapsed(selection)) return selection;
  const range = selectionToRange(selection);
  return { anchor: range.start, focus: range.start };
};

export const collapseToEnd: Endomorphism<Selection> = selection => {
  if (isCollapsed(selection)) return selection;
  const range = selectionToRange(selection);
  return { anchor: range.end, focus: range.end };
};

export const getSelectionFromInputEvent = (event: InputEvent) => (
  getPathByDOMNode: GetPathByDOMNode,
): IO<Option<Selection>> => () =>
  pipe(
    getDOMRangeFromInputEvent(event),
    chain(({ startContainer, startOffset, endContainer, endOffset }) =>
      pipe(
        sequenceT(option)(
          getPathByDOMNode(startContainer)(),
          getPathByDOMNode(endContainer)(),
        ),
        chain(([anchorPath, focusPath]) =>
          some({
            anchor: snoc(anchorPath, startOffset),
            focus: snoc(focusPath, endOffset),
          }),
        ),
      ),
    ),
  );

export const pathToSelection = (path: NonEmptyPath): Selection => ({
  anchor: path,
  focus: path,
});

/**
 * `{ anchor: [1, 2], focus: [1, 3] }` to `{ anchor: [1], focus: [1] }`
 */
export const initSelection = (selection: Selection): Option<Selection> =>
  sequenceS(option)({
    anchor: pipe(init(selection.anchor), filter(isNonEmpty)),
    focus: pipe(init(selection.focus), filter(isNonEmpty)),
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
