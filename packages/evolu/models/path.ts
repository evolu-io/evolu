import { getEq, init, isNonEmpty, snoc, takeLeft } from 'fp-ts/lib/Array';
import { eqNumber } from 'fp-ts/lib/Eq';
import { Endomorphism } from 'fp-ts/lib/function';
import { head, last, tail } from 'fp-ts/lib/NonEmptyArray';
import { chain, fromPredicate, Option } from 'fp-ts/lib/Option';
import { fromCompare, Ord } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import { Path, PathMaybeEmpty, PathIndex } from '../types';

export const eqPath = getEq(eqNumber);

/**
 * Forward (1) or backward (-1) or equal (0). Use lt, gt, geq etc. fp-ts helpers.
 */
export const byDirection: Ord<Path> = fromCompare((x, y) =>
  eqPath.equals(x, y)
    ? 0
    : !x.some((value, index) => value > y[index])
    ? 1
    : -1,
);

// TODO: byChild byParent byAncestor etc.

/**
 * Contains (1) or not (-1) or equal (0). Use lt, gt, geq etc. fp-ts helpers.
 */
export const byContains: Ord<Path> = fromCompare((x, y) =>
  eqPath.equals(x, y)
    ? 0
    : x.length < y.length && eqPath.equals(x, takeLeft(x.length)(y))
    ? 1
    : -1,
);

/**
 * Get Path with initial (without the last) PathIndexes.
 */
export const initPath = (path: Path): Option<Path> =>
  pipe(
    path,
    init,
    chain(fromPredicate(isNonEmpty)),
  );

// TODO: Rename.
export const movePath = (offset: number): Endomorphism<Path> => path =>
  snoc(path.slice(0, -1), last(path) + offset);

export const pathToHeadAndTail = (path: Path): [PathIndex, PathMaybeEmpty] => [
  head(path),
  tail(path),
];

export const pathToInitAndLast = (path: Path): [PathMaybeEmpty, PathIndex] => [
  path.slice(0, -1),
  last(path),
];
