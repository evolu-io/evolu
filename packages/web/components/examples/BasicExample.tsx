import React, { useState, useCallback } from 'react';
import { Editor, EditorValue, useLogEditorValue, EditorSelection } from 'slad';
import { Text } from '../Text';
import { defaultEditorProps } from './_defaultEditorProps';

export function BasicExample({
  autoFocus = false,
  initialSelection = undefined,
}: {
  autoFocus?: boolean;
  initialSelection?: EditorSelection;
}) {
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
    hasFocus: autoFocus,
    selection: initialSelection,
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
      <Text size={1}>Basic Example</Text>
      <Editor
        {...defaultEditorProps}
        value={editorValue}
        onChange={handleEditorChange}
      />
      {logEditorValueElement}
    </>
  );
}
