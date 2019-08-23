import { Immutable } from 'immer';
import { EditorSelection } from './selection';
import { EditorElement, EditorDivElement } from './element';

/**
 * Immutable value describing Editor state.
 */
export interface EditorValue<T extends EditorElement = EditorDivElement> {
  readonly element: Immutable<T>;
  readonly selection?: EditorSelection;
  readonly hasFocus?: boolean;
  readonly blurWithinWindow?: boolean;
}
