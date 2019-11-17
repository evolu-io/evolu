import React, { useState, useCallback } from 'react';
import { createValue, useLogValue, Value, Editor } from 'evolu';
import { testSelectionElement } from './testSelection';

const initialValue = createValue({
  element: testSelectionElement,
});

const TestSelectionNoFocusNoSelection = () => {
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

export default TestSelectionNoFocusNoSelection;
