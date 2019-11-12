import { sequenceS, sequenceT } from 'fp-ts/lib/Apply';
import { init, isNonEmpty, snoc } from 'fp-ts/lib/Array';
import { Eq, getStructEq } from 'fp-ts/lib/Eq';
import { Endomorphism, Predicate } from 'fp-ts/lib/function';
import { IO } from 'fp-ts/lib/IO';
import { chain, filter, Option, option, some } from 'fp-ts/lib/Option';
import { geq } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import {
  GetPathByDOMNode,
  NonEmptyPath,
  Range,
  Selection,
  Path,
  PathIndex,
} from '../types';
import { getDOMRangeFromInputEvent } from './dom';
import { byDirection, eqPath, movePath } from './path';

// Technically, it does not have to return Option, but it's
// future compatible API when we switch to newtype-ts.
// https://dev.to/gcanti/functional-design-smart-constructors-14nb
export const makeSelection = (arg: {
  anchorPath: Path;
  anchorOffset: PathIndex;
  focusPath: Path;
  focusOffset: PathIndex;
}): Option<Selection> =>
  some({
    anchor: snoc(arg.anchorPath, arg.anchorOffset),
    focus: snoc(arg.focusPath, arg.focusOffset),
  });

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
    chain(
      ({
        startContainer,
        startOffset: anchorOffset,
        endContainer,
        endOffset: focusOffset,
      }) =>
        pipe(
          sequenceT(option)(
            getPathByDOMNode(startContainer)(),
            getPathByDOMNode(endContainer)(),
          ),
          chain(([anchorPath, focusPath]) =>
            makeSelection({ anchorPath, anchorOffset, focusPath, focusOffset }),
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
