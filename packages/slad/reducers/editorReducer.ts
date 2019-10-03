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
  | { type: 'setTextOnInsert'; text: string; selection?: EditorSelection }
  | { type: 'setTextOnDelete'; text: string; selection: EditorSelection };
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

    case 'setTextOnInsert':
      return pipe(
        state,
        setText(action.text),
        state => {
          if (!action.selection) return state;
          return select(action.selection)(state);
        },
      );

    case 'setTextOnDelete':
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
