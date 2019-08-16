import { Immutable } from 'immer';
import { Selection } from './selection';
import { Element, DivElement } from './element';

/**
 * Immutable value describing Editor state.
 */
export interface Value<T extends Element = DivElement> {
  readonly element: Immutable<T>;
  // We can make them optional later, but remember adding prop even undefined
  // Immer correctly recognizes as a change, so we would have to ignore it manually.
  // Be explicit, not smart, for now.
  readonly selection: Selection | undefined;
  readonly hasFocus: boolean;
}
