import { Optional } from 'utility-types';
import { EditorElement, EditorDOMElement } from './element';
import { EditorSelection, editorSelectionsAreEqual } from './selection';

export interface EditorState<T extends EditorElement = EditorDOMElement> {
  readonly element: T;
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

export function editorStatesAreEqual<T extends EditorElement>(
  editorState1: EditorState<T> | null,
  editorState2: EditorState<T> | null,
): boolean {
  if (editorState1 === editorState2) return true;
  if (editorState1 == null || editorState2 == null) return false;
  return (
    editorState1.element === editorState2.element &&
    editorState1.hasFocus === editorState2.hasFocus &&
    editorSelectionsAreEqual(editorState1.selection, editorState2.selection)
  );
}
