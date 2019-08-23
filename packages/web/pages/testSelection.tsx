import React, { useState } from 'react';
import { EditorSelection } from 'slad';
import { SchemaExample } from '../components/examples/SchemaExample';

function TestSelection() {
  const [editorSelection, setEditorSelection] = useState<
    EditorSelection | undefined
  >();

  return (
    <>
      <SchemaExample
        autoFocus
        initialSelection={editorSelection}
        key={JSON.stringify(editorSelection)}
      />
      <div>
        <button
          className="select-first-two-letters"
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            setEditorSelection({
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
            setEditorSelection({
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
            setEditorSelection({
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
            setEditorSelection({
              anchor: [4],
              focus: [0, 0, 0],
            });
          }}
        >
          select all backward
        </button>
      </div>
    </>
  );
}

export default TestSelection;
