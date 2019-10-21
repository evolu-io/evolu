import { Path } from './path';

/**
 * Like DOM Range, but with EditorPath for the start and the end.
 * Range should be an implementation detail where an operation needs to know
 * the direction.
 * https://developer.mozilla.org/en-US/docs/Web/API/Range
 */
export interface Range {
  readonly start: Path;
  readonly end: Path;
}
