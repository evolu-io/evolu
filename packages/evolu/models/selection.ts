import { sequenceS } from 'fp-ts/lib/Apply';
import { init, isNonEmpty } from 'fp-ts/lib/Array';
import { Eq, getStructEq } from 'fp-ts/lib/Eq';
import { Endomorphism, identity, Predicate } from 'fp-ts/lib/function';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { chain, filter, fold, map, Option, option } from 'fp-ts/lib/Option';
import { geq } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import { NonEmptyPath, PathDelta, Range, Selection } from '../types';
import { byDirection, eqPath, movePath, toNonEmptyPath } from './path';

/**
 * Helper for tests. With FP, we never throw. But tests are different, they throw.
 */
export const unsafeSelection = ({
  anchor,
  focus,
}: {
  anchor: NonEmptyArray<number>;
  focus: NonEmptyArray<number>;
}): Selection =>
  pipe(
    sequenceS(option)({
      anchor: toNonEmptyPath(anchor),
      focus: toNonEmptyPath(focus),
    }),
    fold(() => {
      throw new Error('invalid selection');
    }, identity),
  );

export const selectionFromPath = (path: NonEmptyPath): Selection => ({
  anchor: path,
  focus: path,
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

export const moveSelectionAnchor = (delta: PathDelta) => (
  selection: Selection,
): Option<Selection> =>
  pipe(
    movePath(delta)(selection.anchor),
    map(path => ({ ...selection, path })),
  );

export const moveSelectionFocus = (delta: PathDelta) => (
  selection: Selection,
): Option<Selection> =>
  pipe(
    movePath(delta)(selection.focus),
    map(path => ({ ...selection, path })),
  );

export const moveSelection = (delta: PathDelta) => (
  selection: Selection,
): Option<Selection> =>
  pipe(selection, moveSelectionAnchor(delta), chain(moveSelectionFocus(delta)));

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

/**
 * `{ anchor: [1, 2], focus: [1, 3] }` to `{ anchor: [1], focus: [1] }`
 */
export const initSelection = (selection: Selection): Option<Selection> =>
  sequenceS(option)({
    anchor: pipe(init(selection.anchor), filter(isNonEmpty)),
    focus: pipe(init(selection.focus), filter(isNonEmpty)),
  });
