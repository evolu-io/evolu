import { pipe } from 'fp-ts/lib/pipeable';
import { Reducer } from 'react';
import { absurd } from 'fp-ts/lib/function';
import { Selection } from '../models/selection';
import {
  // deleteContent,
  State,
  select,
  setText,
  isStateWithSelection,
} from '../models/state';
import { warn } from '../warn';

export type EditorAction =
  | { type: 'focus' }
  | { type: 'blur' }
  | { type: 'selectionChange'; selection: Selection }
  | { type: 'insertText'; text: string; selection: Selection }
  | { type: 'deleteText'; text: string; selection: Selection }
  | { type: 'insertReplacementText'; text: string };
// | { type: 'set'; state: State }
// | { type: 'deleteContent'; selection: Selection };

export type EditorReducer = Reducer<State, EditorAction>;

export const editorReducer: EditorReducer = (state, action) => {
  switch (action.type) {
    case 'focus':
      if (state.hasFocus) return state;
      return { ...state, hasFocus: true };

    case 'blur':
      if (!state.hasFocus) return state;
      return { ...state, hasFocus: false };

    case 'selectionChange': {
      return select(action.selection)(state);
    }

    case 'insertText':
      if (!isStateWithSelection(state)) {
        warn('State in insertText should have a selection.');
        return state;
      }
      // We have to set text first so it can be selected later.
      return pipe(
        state,
        setText(action.text),
        select(action.selection),
      );

    case 'deleteText':
      // We have to set selection of text to be deleted.
      return pipe(
        state,
        select(action.selection),
        setText(action.text),
      );

    case 'insertReplacementText':
      if (!isStateWithSelection(state)) {
        warn('State in insertReplacementText should have a selection.');
        return state;
      }
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
