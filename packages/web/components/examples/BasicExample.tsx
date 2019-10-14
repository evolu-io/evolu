import React, { useState, useCallback } from 'react';
import * as editor from 'evolu';
import { some } from 'fp-ts/lib/Option';
import { Text } from '../Text';
import { defaultEditorProps } from './_defaultEditorProps';

// Export for testEditorServer.
export const initialEditorState = editor.createEditorState({
  element: {
    id: editor.id(),
    tag: 'div',
    props: {
      className: 'root',
    },
    children: [
      {
        id: editor.id(),
        tag: 'div',
        props: {
          // Uncomment 'width: 1' to check types.
          // width: 1,
          style: { fontSize: '24px' },
        },
        children: [{ id: editor.id(), text: 'heading' }],
      },
      {
        id: editor.id(),
        tag: 'div',
        props: {
          style: { fontSize: '16px' },
        },
        children: [{ id: editor.id(), text: 'paragraph' }],
      },
    ],
  },
});

export const initialEditorStateWithTextOnly = editor.createEditorState({
  element: editor.jsx(<div className="root">a</div>),
});

export function BasicExample({
  autoFocus = false,
  initialSelection = null,
  onlyText = false,
}: {
  autoFocus?: boolean;
  initialSelection?: editor.EditorSelection | null;
  onlyText?: boolean;
}) {
  const [editorState, setEditorState] = useState({
    ...(onlyText ? initialEditorStateWithTextOnly : initialEditorState),
    ...(autoFocus != null && { hasFocus: autoFocus }),
    ...(initialSelection != null && { selection: some(initialSelection) }),
  });

  const [logEditorState, logEditorStateElement] = editor.useLogEditorState(
    editorState,
  );

  const handleEditorChange = useCallback(
    (editorState: editor.EditorState) => {
      logEditorState(editorState);
      setEditorState(editorState);
    },
    [logEditorState],
  );

  return (
    <>
      <Text size={1}>Basic Example</Text>
      <editor.Editor
        {...defaultEditorProps}
        editorState={editorState}
        onChange={handleEditorChange}
      />
      {logEditorStateElement}
    </>
  );
}
