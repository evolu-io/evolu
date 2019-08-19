import React, { useState, useCallback } from 'react';
import { Editor, Value, normalizeElement } from 'slad';

function TestNormalizeElement() {
  const [editorValue, setEditorValue] = useState<Value>({
    element: normalizeElement({
      children: [
        {
          children: ['a', '', 'b'],
        },
      ],
    }),
    selection: undefined,
    hasFocus: false,
  });

  const handleEditorChange = useCallback((value: Value) => {
    setEditorValue(value);
  }, []);

  return <Editor value={editorValue} onChange={handleEditorChange} />;
}

export default TestNormalizeElement;
