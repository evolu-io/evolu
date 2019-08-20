import { Immutable } from 'immer';
import { EditorSelection } from './selection';
import { EditorElement, EditorDivElement } from './element';

/**
 * Immutable value describing Editor state.
 */
export interface EditorValue<T extends EditorElement = EditorDivElement> {
  readonly element: Immutable<T>;
  // We can make them optional later, but remember adding prop even undefined
  // Immer correctly recognizes as a change, so we would have to ignore it manually.
  // Be explicit, not smart, for now.
  readonly selection: EditorSelection | undefined;
  readonly hasFocus: boolean;
}
