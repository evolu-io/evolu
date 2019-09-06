import React, { useState, useCallback } from 'react';
import {
  Editor,
  EditorState,
  useLogEditorState,
  EditorSelection,
  EditorReactDOMElement,
  createEditorState,
} from 'slad';
import { Text } from '../Text';
import { defaultEditorProps } from './_defaultEditorProps';

export const initialEditorReactDOMElement: EditorReactDOMElement = {
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
};

export function BasicExample({
  autoFocus = false,
  initialElement = initialEditorReactDOMElement,
  initialSelection = null,
}: {
  autoFocus?: boolean;
  initialElement?: EditorReactDOMElement;
  initialSelection?: EditorSelection | null;
}) {
  const [editorState, setEditorState] = useState(
    createEditorState({
      element: initialElement,
      hasFocus: autoFocus,
      selection: initialSelection,
    }),
  );

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
