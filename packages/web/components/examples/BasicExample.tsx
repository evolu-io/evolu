import React, { useState, useCallback } from 'react';
import { Editor, EditorState, useLogEditorState, EditorSelection } from 'slad';
import { Text } from '../Text';
import { defaultEditorProps } from './_defaultEditorProps';

export function BasicExample({
  autoFocus = false,
  initialSelection = undefined,
}: {
  autoFocus?: boolean;
  initialSelection?: EditorSelection;
}) {
  const [editorState, setEditorState] = useState<EditorState>({
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

  const [logEditorState, logEditorStateElement] = useLogEditorState(
    editorState,
  );

  const handleEditorChange = useCallback(
    (editorState: EditorState) => {
      logEditorState(editorState);
      setEditorState(editorState);
    },
    [logEditorState],
  );

  return (
    <>
      <Text size={1}>Basic Example</Text>
      <Editor
        {...defaultEditorProps}
        editorState={editorState}
        onChange={handleEditorChange}
      />
      {logEditorStateElement}
    </>
  );
}
