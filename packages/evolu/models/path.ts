import { getEq, snoc, takeLeft } from 'fp-ts/lib/Array';
import { eqNumber } from 'fp-ts/lib/Eq';
import { Endomorphism, Refinement } from 'fp-ts/lib/function';
import { last } from 'fp-ts/lib/NonEmptyArray';
import { Option, some, none } from 'fp-ts/lib/Option';
import { fromCompare, Ord } from 'fp-ts/lib/Ord';
import { NonEmptyPath, NonEmptyPathWithOffset, Path } from '../types';

export const isNonEmptyPath: Refinement<Path, NonEmptyPath> = (
  path,
): path is NonEmptyPath => {
  return path.length > 0;
};

export const isNonEmptyPathWithOffset: Refinement<
  Path,
  NonEmptyPathWithOffset
> = (path): path is NonEmptyPathWithOffset => {
  return path.length > 1;
};

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

export const initNonEmptyPath = (path: NonEmptyPath): Path => path.slice(0, -1);

export const initNonEmptyPathWithOffset = (
  path: NonEmptyPathWithOffset,
): NonEmptyPath => initNonEmptyPath(path) as NonEmptyPath;

export const tryInitNonEmptyPath = (path: NonEmptyPath): Option<NonEmptyPath> =>
  isNonEmptyPathWithOffset(path)
    ? some(initNonEmptyPathWithOffset(path))
    : none;

export const movePath = (offset: number): Endomorphism<NonEmptyPath> => path =>
  snoc(initNonEmptyPath(path), last(path) + offset);
