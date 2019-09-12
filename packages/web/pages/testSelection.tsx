import React, { useState, useCallback } from 'react';
import {
  Editor,
  EditorState,
  useLogEditorState,
  EditorSelection,
  createEditorState,
  EditorDOMElement,
  id,
} from 'slad';

export const testSelectionElement: EditorDOMElement = {
  id: id(),
  tag: 'div',
  props: {
    className: 'root',
  },
  children: [
    {
      id: id(),
      tag: 'div',
      props: {
        style: { fontSize: '24px' },
      },
      children: [{ id: id(), text: 'heading' }],
    },
    {
      id: id(),
      tag: 'div',
      props: {
        style: { fontSize: '16px' },
      },
      children: [{ id: id(), text: 'paragraph' }],
    },
  ],
};

const initialEditorState = createEditorState({
  element: testSelectionElement,
});

function TestSelection() {
  const [editorState, setEditorState] = useState(initialEditorState);

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

  function select(selection: EditorSelection | null) {
    handleEditorChange({ ...editorState, hasFocus: true, selection });
  }

  return (
    <>
      <Editor editorState={editorState} onChange={handleEditorChange} />
      {logEditorStateElement}
      <div>
        <button
          className="select-first-two-letters"
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            select({
              anchor: [0, 0, 0],
              focus: [0, 0, 2],
            });
          }}
        >
          select first two letters
        </button>
        <button
          className="select-first-two-letters-backward"
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            select({
              anchor: [0, 0, 2],
              focus: [0, 0, 0],
            });
          }}
        >
          select first two letters backward
        </button>
        <button
          className="select-all"
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            select({
              anchor: [0, 0, 0],
              focus: [1, 0, 9],
            });
          }}
        >
          select all
        </button>
        <button
          className="select-all-backward"
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            select({
              anchor: [1, 0, 9],
              focus: [0, 0, 0],
            });
          }}
        >
          select all backward
        </button>
        <button
          className="unselect"
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            select(null);
          }}
        >
          unselect
        </button>
      </div>
    </>
  );
}

export default TestSelection;
