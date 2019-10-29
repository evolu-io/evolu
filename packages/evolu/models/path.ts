import { snoc, getEq, isNonEmpty, init } from 'fp-ts/lib/Array';
import { eqNumber } from 'fp-ts/lib/Eq';
import { Endomorphism } from 'fp-ts/lib/function';
import { fromCompare, Ord } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import { Option, fromPredicate, chain } from 'fp-ts/lib/Option';
import { last } from 'fp-ts/lib/NonEmptyArray';
import { Path } from '../types';

/**
 * To compare paths whether they are equal.
 */
export const eqPath = getEq(eqNumber);

/**
 * To sort paths by direction aka if they are forward or backward or the same.
 */
export const byDirection: Ord<Path> = fromCompare((x, y) =>
  eqPath.equals(x, y)
    ? 0
    : !x.some((value, index) => value > y[index])
    ? 1
    : -1,
);

export const initPath = (path: Path): Option<Path> =>
  pipe(
    path,
    init,
    chain(fromPredicate(isNonEmpty)),
  );

// TODO: Rename.
export const movePath = (offset: number): Endomorphism<Path> => path =>
  snoc(path.slice(0, -1), last(path) + offset);

// TODO: contains, parent, etc.
