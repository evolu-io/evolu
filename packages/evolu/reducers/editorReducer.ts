import { pipe } from 'fp-ts/lib/pipeable';
import { Reducer } from 'react';
import { absurd } from 'fp-ts/lib/function';
import { Selection } from '../models/selection';
import {
  // deleteContent,
  Value,
  select,
  setText,
  isValueWithSelection,
} from '../models/value';
import { warn } from '../warn';

export type EditorAction =
  | { type: 'focus' }
  | { type: 'blur' }
  | { type: 'selectionChange'; selection: Selection }
  | { type: 'insertText'; text: string; selection: Selection }
  | { type: 'deleteText'; text: string; selection: Selection }
  | { type: 'insertReplacementText'; text: string };
// | { type: 'set'; value: Value }
// | { type: 'deleteContent'; selection: Selection };

export type EditorReducer = Reducer<Value, EditorAction>;

export const editorReducer: EditorReducer = (value, action) => {
  switch (action.type) {
    case 'focus':
      if (value.hasFocus) return value;
      return { ...value, hasFocus: true };

    case 'blur':
      if (!value.hasFocus) return value;
      return { ...value, hasFocus: false };

    case 'selectionChange': {
      return select(action.selection)(value);
    }

    case 'insertText':
      // TODO: Move burden to beforeInput.
      if (!isValueWithSelection(value)) {
        warn('Value in insertText should have a selection.');
        return value;
      }
      // We have to set text first so it can be selected later.
      return pipe(
        value,
        setText(action.text),
        select(action.selection),
      );

    case 'deleteText':
      // We have to set selection of text to be deleted.
      return pipe(
        value,
        select(action.selection),
        setText(action.text),
      );

    case 'insertReplacementText':
      // TODO: Move burden to beforeInput.
      if (!isValueWithSelection(value)) {
        warn('Value in insertReplacementText should have a selection.');
        return value;
      }
      return pipe(
        value,
        setText(action.text),
      );

    // case 'deleteContent':
    //   return deleteContent(action.selection)(value);

    default:
      return absurd(action);
  }
};
