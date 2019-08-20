import React, { useState, useCallback } from 'react';
import { Editor, EditorValue } from 'slad';
import { Text } from '../Text';
import { LogValue } from '../LogValue';
import { defaultEditorProps } from './_defaultEditorProps';

export function BasicExample({ hasFocus = false }: { hasFocus?: boolean }) {
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
    selection: undefined,
    hasFocus,
  });

  const handleEditorChange = useCallback((value: EditorValue) => {
    setEditorValue(value);
  }, []);

  return (
    <>
      <Text size={1}>Basic Example</Text>
      <Editor
        {...defaultEditorProps}
        value={editorValue}
        onChange={handleEditorChange}
      />
      <LogValue value={editorValue} />
    </>
  );
}
