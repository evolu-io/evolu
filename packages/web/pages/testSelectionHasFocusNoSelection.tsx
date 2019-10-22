import React, { useState, useCallback } from 'react';
import * as editor from 'evolu';
import { testSelectionElement } from './testSelection';

const initialValue = editor.createValue({
  element: testSelectionElement,
  hasFocus: true,
});

const TestSelectionHasFocusNoSelection = () => {
  const [value, setValue] = useState(initialValue);

  const [logValue, logValueElement] = editor.useLogValue(value);

  const handleEditorChange = useCallback(
    (value: editor.Value) => {
      logValue(value);
      setValue(value);
    },
    [logValue],
  );

  return (
    <>
      <editor.Editor value={value} onChange={handleEditorChange} />
      {logValueElement}
    </>
  );
};

export default TestSelectionHasFocusNoSelection;
