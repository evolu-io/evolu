import React, { useState, useCallback } from 'react';
import { Editor, EditorValue, useLogEditorValue } from 'slad';

function TestSelectionNoFocusSomeSelection() {
  const [editorValue, setEditorValue] = useState<EditorValue>({
    element: {
      children: [
        {
          props: {
            style: { fontSize: '24px' },
          },
          children: ['heading'],
        },
        {
          props: {
            style: { fontSize: '16px' },
          },
          children: ['paragraph'],
        },
      ],
    },
    selection: {
      anchor: [0, 0, 0],
      focus: [0, 0, 2],
    },
  });

  const [logEditorValue, logEditorValueElement] = useLogEditorValue(
    editorValue,
  );

  const handleEditorChange = useCallback(
    (value: EditorValue) => {
      logEditorValue(value);
      setEditorValue(value);
    },
    [logEditorValue],
  );

  return (
    <>
      <Editor value={editorValue} onChange={handleEditorChange} />
      {logEditorValueElement}
    </>
  );
}

export default TestSelectionNoFocusSomeSelection;
