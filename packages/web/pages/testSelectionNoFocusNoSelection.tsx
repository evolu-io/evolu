import React, { useState, useCallback } from 'react';
import { Editor, EditorValue, useLogEditorValue } from 'slad';

function TestSelectionNoFocusNoSelection() {
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

export default TestSelectionNoFocusNoSelection;
