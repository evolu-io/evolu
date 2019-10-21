import { Path } from './path';

/**
 * Like DOM Range, but with EditorPath for the start and the end.
 * https://developer.mozilla.org/en-US/docs/Web/API/Range
 */
export interface Range {
  readonly start: Path;
  readonly end: Path;
}
