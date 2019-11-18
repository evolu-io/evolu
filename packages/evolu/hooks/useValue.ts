import { useLayoutEffect, useRef, useCallback } from 'react';
import { EditorProps, EditorIO, Value } from '../types';
import { eqValue } from '../models/value';

export const useValue = (
  value: Value,
  onChange: EditorProps['onChange'],
): [EditorIO['getValue'], EditorIO['setValue'], EditorIO['modifyValue']] => {
  const valueRef = useRef(value);
  useLayoutEffect(() => {
    valueRef.current = value;
  });
  const getValue = useCallback(() => valueRef.current, []);
  const setValue = useCallback<EditorIO['setValue']>(
    nextValue => () => {
      // porovnat, a diff
      // debugAction(action.type, [valueRef.current, action, nextValue]);
      if (eqValue.equals(nextValue, valueRef.current)) return;
      onChange(nextValue);
    },
    [onChange],
  );
  const modifyValue = useCallback<EditorIO['modifyValue']>(
    callback => () => {
      const nextValue = callback(getValue());
      setValue(nextValue)();
    },
    [getValue, setValue],
  );
  return [getValue, setValue, modifyValue];
};
