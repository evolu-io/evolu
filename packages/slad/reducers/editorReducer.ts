import { assertNever } from 'assert-never';
import { Reducer } from 'react';
import { EditorElement } from '../models/element';
import { EditorSelection, editorSelectionsAreEqual } from '../models/selection';
import {
  deleteContent,
  EditorState,
  isEditorStateSelectionValid,
  setText,
} from '../models/state';

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
  | { type: 'setText'; text: string }
  // TODO: To same, imho nepotrebuju a nechci, pro collapsed ani jinak.
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
      const nextState = { ...state, selection: action.selection };
      // Editor is listening document selection changes even during typing.
      // That's how we can leverage native selection behavior without hacks.
      // But if the user types quickly, editor selection can be updated
      // before Editor element itself which will be detected as missing point.
      // It seems we can safely ignore such temporary invalid selection.
      if (!isEditorStateSelectionValid(nextState)) return state;
      return nextState;
    }

    case 'setEditorStatePartial':
      return { ...state, ...action.change };

    case 'setText':
      return setText(action.text)(state);

    case 'deleteContent':
      return deleteContent(action.selection)(state);

    default:
      return assertNever(action);
  }
};
