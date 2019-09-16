import { Immutable } from 'immer';
import { Optional } from 'utility-types';
import { EditorElement, EditorDOMElement } from './element';
import { EditorSelection } from './selection';

export interface EditorState<T extends EditorElement = EditorDOMElement> {
  readonly element: Immutable<T>;
  readonly selection: EditorSelection | null;
  readonly hasFocus: boolean;
}

/**
 * Create editor state. By default, the root element is EditorDOMElement.
 */
export function createEditorState<
  T extends EditorState<EditorElement> = EditorState
>({
  element,
  selection = null,
  hasFocus = false,
}: Optional<T, 'hasFocus' | 'selection'>): T {
  return { element, selection, hasFocus } as T;
}
