import React, { useState, useCallback } from 'react';
import { Editor, EditorValue, useLogEditorValue, EditorSelection } from 'slad';

function TestSelection() {
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

  function select(selection: EditorSelection | undefined) {
    handleEditorChange({ ...editorValue, hasFocus: true, selection });
  }

  return (
    <>
      <Editor value={editorValue} onChange={handleEditorChange} />
      {logEditorValueElement}
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
        {/* <button
          className="select-all"
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            setSchemaEditorSelection({
              anchor: [0, 0, 0],
              focus: [4],
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
            setSchemaEditorSelection({
              anchor: [4],
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
            setBasicEditorSelection(undefined);
          }}
        >
          unselect
        </button> */}
      </div>
    </>
  );
}

export default TestSelection;
