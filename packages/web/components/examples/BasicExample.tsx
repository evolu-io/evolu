import React, { useState, useCallback } from 'react';
import {
  Editor,
  EditorState,
  useLogEditorState,
  EditorSelection,
  createEditorState,
  EditorDOMElement,
} from 'slad';
import { Text } from '../Text';
import { defaultEditorProps } from './_defaultEditorProps';

// Export for testRenderer.
export const initialEditorState = createEditorState<EditorDOMElement>({
  element: {
    tag: 'div',
    children: [
      {
        tag: 'div',
        props: {
          // Uncomment 'width: 1' to check types.
          // width: 1,
          style: { fontSize: '24px' },
        },
        children: [{ text: 'heading' }],
      },
      {
        tag: 'div',
        props: {
          style: { fontSize: '16px' },
        },
        children: [{ text: 'paragraph' }],
      },
    ],
  },
});

export const initialEditorStateWithTextOnly = createEditorState<
  EditorDOMElement
>({
  element: {
    tag: 'div',
    children: [{ text: 'a' }],
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
  const [editorState, setEditorState] = useState({
    ...(onlyText ? initialEditorStateWithTextOnly : initialEditorState),
    ...(autoFocus != null && { hasFocus: autoFocus }),
    ...(initialSelection != null && { selection: initialSelection }),
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
