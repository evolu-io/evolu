import React, { useState, useCallback } from 'react';
import * as editor from 'evolu';
import { Text } from '../Text';
import { defaultEditorProps } from './_defaultEditorProps';

// Export for testEditorServer.
export const initialState = editor.createState<editor.ReactElement>({
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

export const initialStateWithTextOnly = editor.createState({
  element: editor.jsx(<div className="root">a</div>),
});

export function BasicExample({
  autoFocus = false,
  initialSelection = null,
  onlyText = false,
}: {
  autoFocus?: boolean;
  initialSelection?: editor.Selection | null;
  onlyText?: boolean;
}) {
  const [state, setState] = useState({
    ...(onlyText ? initialStateWithTextOnly : initialState),
    ...(autoFocus != null && { hasFocus: autoFocus }),
    ...(initialSelection != null && { selection: initialSelection }),
  });

  const [logState, logStateElement] = editor.useLogState(state);

  const handleEditorChange = useCallback(
    (state: editor.State) => {
      logState(state);
      setState(state);
    },
    [logState],
  );

  return (
    <>
      <Text size={1}>Basic Example</Text>
      <editor.Editor
        {...defaultEditorProps}
        state={state}
        onChange={handleEditorChange}
      />
      {logStateElement}
    </>
  );
}
