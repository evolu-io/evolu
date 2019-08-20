import React, { useState, useCallback } from 'react';
import { Editor, EditorValue, normalizeEditorElement } from 'slad';

function TestNormalizeEditorElement() {
  const [editorValue, setEditorValue] = useState<EditorValue>({
    element: normalizeEditorElement({
      children: [
        {
          children: ['a', '', 'b'],
        },
      ],
    }),
    selection: undefined,
    hasFocus: false,
  });

  const handleEditorChange = useCallback((value: EditorValue) => {
    setEditorValue(value);
  }, []);

  return <Editor value={editorValue} onChange={handleEditorChange} />;
}

export default TestNormalizeEditorElement;
