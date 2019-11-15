import Debug from 'debug';
import { pipe } from 'fp-ts/lib/pipeable';
import { absurd } from 'fp-ts/lib/function';
import { useRef, MutableRefObject, useLayoutEffect, useCallback } from 'react';
import { EditorReducer, EditorProps, EditorIO, Value } from '../types';
import {
  setFocus,
  select,
  setText,
  deleteContent,
  eqValue,
} from '../models/value';

const debugAction = Debug('action');

const reducer: EditorReducer = (value, action) => {
  switch (action.type) {
    case 'focus':
      return pipe(value, setFocus(true));
    case 'blur':
      return pipe(value, setFocus(false));
    case 'selectionChange':
      return pipe(value, select(action.selection));
    case 'setText':
      return pipe(value, setText(action.arg));
    case 'deleteContent':
      return pipe(value, deleteContent(action.selection));
    default:
      return absurd(action);
  }
};

// This is something like stateless reducer with workaround for:
// https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
export const useDispatch = (
  onChange: EditorProps['onChange'],
  value: Value,
): [EditorIO['dispatch'], MutableRefObject<Value>] => {
  // Tohle asi hook!
  const valueRef = useRef(value);
  useLayoutEffect(() => {
    valueRef.current = value;
  });
  const dispatch = useCallback<EditorIO['dispatch']>(
    action => () => {
      const nextValue = reducer(valueRef.current, action);
      debugAction(action.type, [valueRef.current, action, nextValue]);
      if (eqValue.equals(nextValue, valueRef.current)) return;
      onChange(nextValue);
    },
    [onChange],
  );
  return [dispatch, valueRef];
};
