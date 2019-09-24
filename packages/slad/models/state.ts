import { Optional } from 'utility-types';
import { createElement } from 'react';
import produce, { Draft } from 'immer';
import {
  EditorElement,
  EditorReactElement,
  jsxToEditorReactElement,
  editorElementChild,
  EditorElementChild,
} from './element';
import {
  EditorSelection,
  editorSelectionsAreEqual,
  editorSelectionIsCollapsed,
  move,
} from './selection';
import { getParentPathAndLastIndex } from './path';
import { invariantIsEditorText, insertTextToString } from './text';

export interface EditorState<T extends EditorElement = EditorReactElement> {
  readonly element: T;
  readonly selection: EditorSelection | null;
  readonly hasFocus: boolean;
}

/**
 * Create editor state. By default, the root element is EditorReactElement.
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

export function createEditorStateWithText({
  text = '',
  selection = null,
  hasFocus = false,
}: {
  text?: string;
  selection?: EditorSelection | null;
  hasFocus?: boolean;
}) {
  return createEditorState({
    element: jsxToEditorReactElement(
      createElement('div', { className: 'root' }, text),
    ),
    selection,
    hasFocus,
  });
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

export const insertText = (text: string, selection: EditorSelection) =>
  produce(<T extends EditorElement>(draft: Draft<EditorState<T>>) => {
    if (editorSelectionIsCollapsed(selection)) {
      const [parentPath, index] = getParentPathAndLastIndex(selection.anchor);
      const editorText = editorElementChild(draft.element, parentPath) as Draft<
        EditorElementChild
      >;
      if (!invariantIsEditorText(editorText)) return;
      editorText.text = insertTextToString(editorText.text, text, index);
      draft.selection = move(text.length)(selection) as Draft<EditorSelection>;
    } else {
      // TODO: Insert text over selection.
    }
  });

// export const deleteContent = (selection: EditorSelection) =>
