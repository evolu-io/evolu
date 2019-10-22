import React, { useState, useCallback } from 'react';
import { Editor, Value, useLogValue, createValue } from 'evolu';
import { some } from 'fp-ts/lib/Option';
import { testSelectionElement } from './testSelection';

const initialValue = createValue({
  element: testSelectionElement,
  hasFocus: false,
  selection: some({
    anchor: [0, 0, 0],
    focus: [0, 0, 2],
  }),
});

function TestSelectionNoFocusSomeSelection() {
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
}

export default TestSelectionNoFocusSomeSelection;
