import { array, getEq, snoc, takeLeft } from 'fp-ts/lib/Array';
import { eqNumber } from 'fp-ts/lib/Eq';
import { Refinement, identity } from 'fp-ts/lib/function';
import {
  last,
  NonEmptyArray,
  nonEmptyArray,
  map as nonEmptyArrayMap,
} from 'fp-ts/lib/NonEmptyArray';
import { map, none, Option, option, some, fold } from 'fp-ts/lib/Option';
import { fromCompare, Ord } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import { getEq as getNewtypeEq } from 'newtype-ts';
import { prismInteger } from 'newtype-ts/lib/Integer';
import {
  NonNegativeInteger,
  prismNonNegativeInteger,
} from 'newtype-ts/lib/NonNegativeInteger';
import { Prism } from 'monocle-ts';
import {
  NonEmptyPath,
  NonEmptyPathWithOffset,
  Path,
  PathIndex,
  PathDelta,
} from '../types';

/**
 * Smart constructor for PathIndex.
 */
export const toPathIndex: (index: number) => Option<PathIndex> =
  prismNonNegativeInteger.getOption;

/**
 * Unwrap PathIndex.
 */
export const unwrapPathIndex: (index: PathIndex) => number =
  prismNonNegativeInteger.reverseGet;

export const prismPathIndex: Prism<number, PathIndex> = prismNonNegativeInteger;

/**
 * Smart constructor for PathDelta.
 */
export const toPathDelta: (delta: number) => Option<PathDelta> =
  prismInteger.getOption;

/**
 * Unwrap PathDelta.
 */
export const unwrapPathDelta: (delta: PathDelta) => number =
  prismInteger.reverseGet;

export const prismPathDelta: Prism<number, PathDelta> = prismInteger;

/**
 * Smart constructor for Path.
 */
export const toPath = (indexes: number[]): Option<Path> =>
  pipe(indexes.map(toPathIndex), array.sequence(option));

/**
 * Unwrap Path.
 */
export const unwrapPath = (path: Path): number[] => path.map(unwrapPathIndex);

/**
 * Smart constructor for NonEmptyPath.
 */
export const toNonEmptyPath = (
  indexes: NonEmptyArray<number>,
): Option<NonEmptyPath> =>
  pipe(nonEmptyArrayMap(toPathIndex)(indexes), nonEmptyArray.sequence(option));

export const isNonEmptyPath: Refinement<Path, NonEmptyPath> = (
  path,
): path is NonEmptyPath => {
  return path.length > 0;
};

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

export const eqPath = getEq(getNewtypeEq<NonNegativeInteger>(eqNumber));

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
    toPathIndex(unwrapPathIndex(last(path)) + unwrapPathDelta(delta)),
    map(index => snoc(initNonEmptyPath(path), index)),
  );
