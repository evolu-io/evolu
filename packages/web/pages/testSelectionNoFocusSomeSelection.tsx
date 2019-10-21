import React, { useState, useCallback } from 'react';
import { Editor, State, useLogState, createState } from 'evolu';
import { testSelectionElement } from './testSelection';

const initialState = createState({
  element: testSelectionElement,
  hasFocus: false,
  selection: {
    anchor: [0, 0, 0],
    focus: [0, 0, 2],
  },
});

function TestSelectionNoFocusSomeSelection() {
  const [state, setState] = useState(initialState);

  const [logState, logStateElement] = useLogState(state);

  const handleEditorChange = useCallback(
    (state: State) => {
      logState(state);
      setState(state);
    },
    [logState],
  );

  return (
    <>
      <Editor state={state} onChange={handleEditorChange} />
      {logStateElement}
    </>
  );
}

export default TestSelectionNoFocusSomeSelection;
