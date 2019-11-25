import React, { useState, useCallback } from 'react';
import {
  Editor,
  Value,
  useLogValue,
  createValue,
  unsafeSelection,
} from 'evolu';
import { some } from 'fp-ts/lib/Option';
import { testSelectionElement } from './testSelection';

const initialValue = createValue({
  element: testSelectionElement,
  hasFocus: false,
  selection: some(
    unsafeSelection({
      anchor: [0, 0, 0],
      focus: [0, 0, 2],
    }),
  ),
});

const TestSelectionNoFocusSomeSelection = () => {
  const [value, setValue] = useState(initialValue);

  const [logValue, logValueElement] = useLogValue(value);

  const handleEditorChange = useCallback(
    (value: Value) => {
      logValue(value);
      setValue(value);
    },
    [logValue],
  );

  return (
    <>
      <Editor value={value} onChange={handleEditorChange} />
      {logValueElement}
    </>
  );
};

export default TestSelectionNoFocusSomeSelection;
