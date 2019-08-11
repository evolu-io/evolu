import { Immutable } from 'immer';
import { SladSelection } from './selection';
import { SladElement, SladDivElement } from './element';

/**
 * SladValue is immutable value describing editor state.
 */
export interface SladValue<T extends SladElement = SladDivElement> {
  readonly element: Immutable<T>;
  readonly selection?: SladSelection | undefined;
}
