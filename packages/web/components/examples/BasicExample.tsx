import React, { useState, useCallback } from 'react';
import {
  Editor,
  EditorState,
  useLogEditorState,
  EditorSelection,
  createEditorState,
} from 'slad';
import { Text } from '../Text';
import { defaultEditorProps } from './_defaultEditorProps';

// Export for testRenderer.
export const initialEditorState = createEditorState({
  element: {
    children: [
      {
        props: {
          style: { fontSize: '24px' },
        },
        children: [{ text: 'heading' }],
      },
      {
        props: {
          style: { fontSize: '16px' },
        },
        children: [{ text: 'paragraph' }],
      },
    ],
  },
});

export function BasicExample({
  autoFocus = false,
  initialSelection = null,
  onlyText = false,
}: {
  autoFocus?: boolean;
  initialSelection?: EditorSelection | null;
  onlyText?: boolean;
}) {
  const [editorState, setEditorState] = useState(() => {
    // Run createEditorState again to add ids to element.
    return createEditorState({
      ...initialEditorState,
      ...(autoFocus != null && { hasFocus: autoFocus }),
      ...(initialSelection != null && { selection: initialSelection }),
      ...(onlyText && { element: { children: [{ text: 'a' }] } }),
    });
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
