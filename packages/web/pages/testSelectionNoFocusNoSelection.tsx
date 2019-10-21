import React, { useState, useCallback } from 'react';
import * as editor from 'evolu';
import { testSelectionElement } from './testSelection';

const initialState = editor.createState({
  element: testSelectionElement,
});

function TestSelectionNoFocusNoSelection() {
  const [state, setState] = useState(initialState);

  const [logState, logStateElement] = editor.useLogState(state);

  const handleEditorChange = useCallback(
    (state: editor.State) => {
      logState(state);
      setState(state);
    },
    [logState],
  );

  return (
    <>
      <editor.Editor state={state} onChange={handleEditorChange} />
      {logStateElement}
    </>
  );
}

export default TestSelectionNoFocusNoSelection;
