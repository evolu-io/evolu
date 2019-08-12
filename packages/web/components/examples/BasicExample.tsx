import React, { useState, useCallback } from 'react';
import { Editor, Value } from 'slad';
import { Text } from '../Text';
import { SelectionToJsonString } from '../SelectionToJsonString';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const initialState: Value = {
  element: {
    props: {
      style: { backgroundColor: '#ccc' },
    },
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
};

export function BasicExample() {
  const [editorValue, setEditorValue] = useState<Value>(initialState);

  const handleSladEditorChange = useCallback((value: Value) => {
    setEditorValue(value);
  }, []);

  return (
    <>
      <Text>Basic</Text>
      <Editor
        value={editorValue}
        onChange={handleSladEditorChange}
        autoCorrect="off" // Disable browser autoCorrect.
        spellCheck={false} // Disable browser spellCheck.
        data-gramm // Disable Grammarly Chrome extension.
        style={{ width: 300, marginBottom: 24 }}
      />
      <SelectionToJsonString value={editorValue.selection} />
    </>
  );
}
