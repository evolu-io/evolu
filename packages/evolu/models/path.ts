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

/**
 * Smart constructor for PathIndex.
 */
export const toPathIndex = (output: number): Option<PathIndex> =>
  fromEither(PathIndex.decode(output));

/**
 * Smart constructor for PathDelta.
 */
export const toPathDelta = (output: number): Option<PathDelta> =>
  fromEither(PathDelta.decode(output));

/**
 * Smart constructor for Path.
 */
export const toPath = (output: number[]): Option<Path> =>
  pipe(output.map(toPathIndex), array.sequence(option));

/**
 * Smart constructor for NonEmptyPath.
 */
export const toNonEmptyPath = (output: number[]): Option<NonEmptyPath> =>
  pipe(toPath(output), filter(NonEmptyPath.is));

/**
 * Helper for tests. With FP, we never throw. But tests are different, they throw.
 */
export const unsafePath = (output: number[]): Path =>
  pipe(
    toPath(output),
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
