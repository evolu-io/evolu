import React, { useState, useCallback } from 'react';
import * as editor from 'evolu';

export const testSelectionElement: editor.EditorReactElement = {
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
};

const initialEditorState = editor.createEditorState({
  element: testSelectionElement,
});

function TestSelection() {
  const [editorState, setEditorState] = useState(initialEditorState);

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

  function select(selection: editor.EditorSelection) {
    handleEditorChange({
      ...editorState,
      hasFocus: true,
      selection,
    });
  }

  return (
    <>
      <editor.Editor editorState={editorState} onChange={handleEditorChange} />
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
        {/* TODO: Once we decide what we want. */}
        {/* <button
          className="unselect"
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            select(null);
          }}
        >
          unselect
        </button> */}
      </div>
    </>
  );
}

export default TestSelection;
