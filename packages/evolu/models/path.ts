import { foldRight, getEq } from 'fp-ts/lib/Array';
import { eqNumber } from 'fp-ts/lib/Eq';
import { Endomorphism } from 'fp-ts/lib/function';
import { fromCompare, Ord } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';

export type Path = number[];

export const eqPath = getEq(eqNumber);

export const byDirection: Ord<Path> = fromCompare((x, y) =>
  eqPath.equals(x, y)
    ? 0
    : !x.some((value, index) => value > y[index])
    ? 1
    : -1,
);

export function movePath(offset: number): Endomorphism<Path> {
  return path =>
    pipe(
      path,
      foldRight(() => path, (init, last) => [...init, last + offset]),
    );
}
