import { foldRight, getEq } from 'fp-ts/lib/Array';
import { eqNumber } from 'fp-ts/lib/Eq';
import { Endomorphism } from 'fp-ts/lib/function';
import { fromCompare, Ord } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
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

// Do we need it? Is the name right?
export const movePath = (offset: number): Endomorphism<Path> => path =>
  pipe(
    path,
    foldRight(() => path, (init, last) => [...init, last + offset]),
  );

// TODO: contains, parent, etc.
