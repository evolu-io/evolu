import { assertNever } from 'assert-never';
import { Reducer } from 'react';
import { EditorElement } from '../models/element';
import { EditorSelection, editorSelectionsAreEqual } from '../models/selection';
import { EditorState, deleteContent, setText } from '../models/state';

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
  | { type: 'setText'; text: string; selection: EditorSelection }
  | { type: 'deleteContent'; selection: EditorSelection };

export type EditorReducer<T extends EditorElement = EditorElement> = Reducer<
  EditorState<T>,
  EditorAction
>;

export const editorReducer: EditorReducer = (state, action) => {
  switch (action.type) {
    case 'focus':
      return { ...state, hasFocus: true };

    case 'blur':
      return { ...state, hasFocus: false };

    case 'selectionChange': {
      if (editorSelectionsAreEqual(action.selection, state.selection))
        return state;
      return { ...state, selection: action.selection };
    }

    case 'setEditorStatePartial':
      return { ...state, ...action.change };

    case 'setText':
      // TODO: Pipe select then setText.
      return setText(action.text)(state);

    case 'deleteContent':
      return deleteContent(action.selection)(state);

    default:
      return assertNever(action);
  }
};
