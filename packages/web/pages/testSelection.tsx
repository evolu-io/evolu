import React, { useState, useCallback } from 'react';
import {
  ReactElement,
  id,
  createValue,
  useLogValue,
  Value,
  Editor,
  Selection,
} from 'evolu';
import { some } from 'fp-ts/lib/Option';

export const testSelectionElement: ReactElement = {
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
      children: ['heading'],
    },
    {
      id: id(),
      tag: 'div',
      props: {
        style: { fontSize: '16px' },
      },
      children: ['paragraph'],
    },
  ],
};

const initialValue = createValue({
  element: testSelectionElement,
});

const TestSelection = () => {
  const [value, setValue] = useState(initialValue);

  const [logValue, logValueElement] = useLogValue(value);

  const handleEditorChange = useCallback(
    (value: Value) => {
      logValue(value);
      setValue(value);
    },
    [logValue],
  );

  const select = (selection: Selection) => {
    handleEditorChange({
      ...value,
      hasFocus: true,
      selection: some(selection),
    });
  };

  return (
    <>
      <Editor value={value} onChange={handleEditorChange} />
      {logValueElement}
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
      </div>
    </>
  );
};

export default TestSelection;
