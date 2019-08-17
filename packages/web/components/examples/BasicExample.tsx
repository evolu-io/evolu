import React, { useState, useCallback } from 'react';
import { Editor, Value } from 'slad';
import { Text } from '../Text';
import { LogValue } from '../LogValue';
import { defaultEditorProps } from './_defaultEditorProps';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const initialState: Value = {
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
  hasFocus: true,
};

export function BasicExample() {
  const [editorValue, setEditorValue] = useState<Value>(initialState);

  const handleEditorChange = useCallback((value: Value) => {
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
