import { absurd } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import { select, setText, deleteContent } from '../models/value';
import { Reducer } from '../types';

/**
 * Reducer maps various browser actions to editor value.
 */
export const reducer: Reducer = (value, action) => {
  switch (action.type) {
    case 'focus':
      return { ...value, hasFocus: true };

    case 'blur':
      return { ...value, hasFocus: false };

    case 'selectionChange':
      return pipe(
        value,
        select(action.selection),
      );

    case 'insertText':
      return pipe(
        value,
        setText(action.text),
        select(action.selection),
      );

    case 'insertReplacementText':
      return pipe(
        value,
        // insert text pres text, nic vic
        setText(action.text),
      );

    // insertText
    case 'deleteText':
      return pipe(
        value,
        // select, insert pres text?
        select(action.selection),
        setText(action.text),
      );

    case 'deleteContent':
      return pipe(
        value,
        deleteContent(action.selection),
      );

    default:
      return absurd(action);
  }
};
