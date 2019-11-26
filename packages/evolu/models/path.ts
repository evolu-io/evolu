import { array, getEq, snoc, takeLeft } from 'fp-ts/lib/Array';
import { eqNumber } from 'fp-ts/lib/Eq';
import { identity, Refinement } from 'fp-ts/lib/function';
import { last } from 'fp-ts/lib/NonEmptyArray';
import {
  filter,
  fold,
  fromEither,
  map,
  none,
  Option,
  option,
  some,
} from 'fp-ts/lib/Option';
import { fromCompare, Ord } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import {
  NonEmptyPath,
  NonEmptyPathWithOffset,
  Path,
  PathDelta,
  PathIndex,
} from '../types';

export const isNonEmptyPath: Refinement<Path, NonEmptyPath> = (
  path,
): path is NonEmptyPath => {
  return path.length > 0;
};

/**
 * Smart constructor for PathIndex.
 */
export const toPathIndex = (index: number): Option<PathIndex> =>
  fromEither(PathIndex.decode(index));

/**
 * Smart constructor for PathDelta.
 */
export const toPathDelta = (delta: number): Option<PathDelta> =>
  fromEither(PathDelta.decode(delta));

/**
 * Smart constructor for Path.
 */
export const toPath = (indexes: number[]): Option<Path> =>
  pipe(indexes.map(toPathIndex), array.sequence(option));

/**
 * Smart constructor for NonEmptyPath.
 */
export const toNonEmptyPath = (indexes: number[]): Option<NonEmptyPath> =>
  pipe(toPath(indexes), filter(isNonEmptyPath));

/**
 * Helper for tests. With FP, we never throw. But tests are different, they throw.
 */
export const unsafePath = (indexes: number[]): Path =>
  pipe(
    toPath(indexes),
    fold(() => {
      throw new Error('invalid path');
    }, identity),
  );

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

export const movePath = (delta: PathDelta) => (
  path: NonEmptyPath,
): Option<NonEmptyPath> =>
  pipe(
    toPathIndex(last(path) + delta),
    map(index => snoc(initNonEmptyPath(path), index)),
  );
