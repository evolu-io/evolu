import React, { useState, useCallback } from 'react';
import { SladEditor, SladValue } from 'slad';
import { Text } from '../Text';

const initialState: SladValue = {
  element: {
    props: {
      style: { backgroundColor: '#ccc' },
    },
    children: [
      {
        props: {
          style: { fontSize: '24px' },
        },
        children: [{ type: 'text', value: 'heading 1' }],
      },
      {
        props: {
          style: { fontSize: '16px' },
        },
        children: [{ type: 'text', value: 'paragraph' }],
      },
    ],
  },
};

export function SladEditorWithDefaultProps() {
  const [editorValue, setEditorValue] = useState<SladValue>(initialState);

  const handleSladEditorChange = useCallback((value: SladValue) => {
    setEditorValue(value);
  }, []);

  return (
    <>
      <Text>Editor with default props</Text>
      <SladEditor
        value={editorValue}
        onChange={handleSladEditorChange}
        autoCorrect="off" // Disable browser autoCorrect.
        spellCheck={false} // Disable browser spellCheck.
        data-gramm // Disable Grammarly Chrome extension.
        style={{ width: 300, marginBottom: 24 }}
      />
    </>
  );
}
