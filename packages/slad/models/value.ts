import { Immutable } from 'immer';
import { EditorSelection } from './selection';
import { EditorElement, EditorDivElement } from './element';

/**
 * Immutable value describing Editor state.
 * TODO: Rename to EditorState.
 */
export interface EditorValue<T extends EditorElement = EditorDivElement> {
  readonly element: Immutable<T>;
  // TODO: Make it optional.
  readonly selection: EditorSelection | undefined;
  readonly hasFocus: boolean;
  readonly blurWithinWindow?: boolean | undefined;
}
