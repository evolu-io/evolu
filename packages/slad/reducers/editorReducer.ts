import { assertNever } from 'assert-never';
import { pipe } from 'fp-ts/lib/pipeable';
import { Reducer } from 'react';
import { EditorElement } from '../models/element';
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
  | {
      type: 'setEditorStatePartial';
      change: Partial<EditorState<EditorElement>>;
    }
  // beforeinput actions
  | { type: 'insertText'; text: string; selection: EditorSelection }
  | { type: 'deleteText'; text: string; selection: EditorSelection };
// | { type: 'deleteContent'; selection: EditorSelection };

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
      return select(action.selection)(state);
    }

    case 'setEditorStatePartial':
      return { ...state, ...action.change };

    case 'insertText':
      // We have to set text first so it can be selected later.
      return pipe(
        state,
        setText(action.text),
        select(action.selection),
      );

    case 'deleteText':
      // We have to set selection first so it will not point to deleted text.
      return pipe(
        state,
        select(action.selection),
        setText(action.text),
      );

    // case 'deleteContent':
    //   return deleteContent(action.selection)(state);

    default:
      return assertNever(action);
  }
};
