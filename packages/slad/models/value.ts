import { Immutable } from 'immer';
import { Selection } from './selection';
import { Element, DivElement } from './element';

/**
 * Immutable value describing Editor state.
 */
export interface Value<T extends Element = DivElement> {
  readonly element: Immutable<T>;
  readonly selection?: Selection | undefined;
}
