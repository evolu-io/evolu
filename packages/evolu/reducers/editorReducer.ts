import { pipe } from 'fp-ts/lib/pipeable';
import { Reducer } from 'react';
import { absurd } from 'fp-ts/lib/function';
import { EditorSelection } from '../models/selection';
import {
  // deleteContent,
  EditorState,
  select,
  setText,
} from '../models/state';

/**
 * Various browser actions for updating EditorState.
 */
export type EditorAction =
  | { type: 'focus' }
  | { type: 'blur' }
  | { type: 'selectionChange'; selection: EditorSelection }
  | { type: 'setEditorState'; change: Partial<EditorState> }
  | { type: 'insertText'; text: string; selection: EditorSelection }
  | { type: 'deleteText'; text: string; selection: EditorSelection }
  | { type: 'insertReplacementText'; text: string };
// | { type: 'deleteContent'; selection: EditorSelection };

export type EditorReducer = Reducer<EditorState, EditorAction>;

export const editorReducer: EditorReducer = (state, action) => {
  switch (action.type) {
    case 'focus':
      return { ...state, hasFocus: true };

    case 'blur':
      return { ...state, hasFocus: false };

    case 'selectionChange': {
      return select(action.selection)(state);
    }

    case 'setEditorState':
      return { ...state, ...action.change };

    case 'insertText':
      // We have to set text first so it can be selected later.
      return pipe(
        state,
        setText(action.text),
        select(action.selection),
      );

    case 'deleteText':
      // We have to set selection text to be deleted.
      return pipe(
        state,
        select(action.selection),
        setText(action.text),
      );

    case 'insertReplacementText':
      return pipe(
        state,
        setText(action.text),
      );

    // case 'deleteContent':
    //   return deleteContent(action.selection)(state);

    default:
      return absurd(action);
  }
};
