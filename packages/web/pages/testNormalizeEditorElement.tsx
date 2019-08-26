import React, { useState } from 'react';
import { Editor, EditorState, normalizeEditorElement } from 'slad';

function TestNormalizeEditorElement() {
  const [editorState, setEditorState] = useState<EditorState>({
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

  return <Editor editorState={editorState} onChange={setEditorState} />;
}

export default TestNormalizeEditorElement;
