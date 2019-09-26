import { assertNever } from 'assert-never';
import produce, { Draft } from 'immer';
import { Reducer } from 'react';
import { EditorElement } from '../models/element';
import { EditorSelection, editorSelectionsAreEqual } from '../models/selection';
import { EditorState, insertText, deleteContent } from '../models/state';

/**
 * Various browser actions for updating EditorState.
 */
export type EditorAction =
  | { type: 'focus' }
  | { type: 'blur' }
  | { type: 'selectionChange'; selection: EditorSelection | null }
  | {
      type: 'setEditorStatePartial';
      change: Partial<EditorState<EditorElement>>;
    }
  // beforeinput actions
  | { type: 'insertText'; selection: EditorSelection; text: string }
  | { type: 'deleteContent'; selection: EditorSelection };

export type EditorReducer<T extends EditorElement = EditorElement> = Reducer<
  EditorState<T>,
  EditorAction
>;

/**
 * Create editor reducer from Immer producer.
 */
export function createEditorReducer<T extends EditorElement = EditorElement>(
  producer: (
    draft: Draft<EditorState<T>>,
    action: EditorAction,
  ) => Draft<EditorState<T>> | void,
): EditorReducer<T> {
  return produce(producer) as EditorReducer<T>;
}

export const editorReducer = createEditorReducer((draft, action) => {
  switch (action.type) {
    case 'focus':
      draft.hasFocus = true;
      return;

    case 'blur':
      draft.hasFocus = false;
      return;

    case 'selectionChange':
      if (editorSelectionsAreEqual(action.selection, draft.selection)) return;
      draft.selection = action.selection as Draft<EditorSelection>;
      return;

    case 'setEditorStatePartial':
      Object.keys(action.change).forEach(prop => {
        // @ts-ignore TODO: Fix it.
        draft[prop] = action.change[prop as keyof EditorState];
      });
      return;

    case 'insertText':
      return insertText(action.text, action.selection)(draft);

    case 'deleteContent':
      return deleteContent(action.selection)(draft);

    default:
      return assertNever(action);
  }
});
