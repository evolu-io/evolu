import { absurd } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import { select, setText, deleteContent } from '../models/value';
import { Reducer } from '../types';

export const reducer: Reducer = (value, action) => {
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
      return pipe(
        value,
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
