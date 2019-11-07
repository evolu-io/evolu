import { absurd } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import { select, setText, deleteContent, setFocus } from '../models/value';
import { Reducer } from '../types';

/**
 * Reducer maps browser actions to Value endomorphisms.
 */
export const reducer: Reducer = (value, action) => {
  switch (action.type) {
    case 'focus':
      return pipe(
        value,
        setFocus(true),
      );

    case 'blur':
      return pipe(
        value,
        setFocus(false),
      );

    case 'selectionChange':
      return pipe(
        value,
        select(action.selection),
      );

    // case 'setText':
    //   return pipe(
    //     value,
    //     // setText(action.operation),
    //   );

    case 'insertText':
      return pipe(
        value,
        setText(action.text),
        select(action.selection),
      );

    case 'insertReplacementText':
      return pipe(
        value,
        setText(action.text),
      );

    case 'deleteText':
      return pipe(
        value,
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
