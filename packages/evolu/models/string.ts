import { Predicate } from 'fp-ts/lib/function';

export const stringIsBR: Predicate<string> = text => text.length === 0;
