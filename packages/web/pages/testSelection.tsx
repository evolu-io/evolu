import React, { useState, useCallback } from 'react';
import {
  ReactElement,
  id,
  createValue,
  useLogValue,
  Value,
  Editor,
  Selection,
  selection,
} from 'evolu';
import { some, fold } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { constVoid } from 'fp-ts/lib/function';

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
            pipe(
              selection({
                anchor: [0, 0, 0],
                focus: [0, 0, 2],
              }),
              fold(constVoid, select),
            );
          }}
        >
          select first two letters
        </button>
        <button
          className="select-first-two-letters-backward"
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            pipe(
              selection({
                anchor: [0, 0, 2],
                focus: [0, 0, 0],
              }),
              fold(constVoid, select),
            );
          }}
        >
          select first two letters backward
        </button>
        <button
          className="select-all"
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            pipe(
              selection({
                anchor: [0, 0, 0],
                focus: [1, 0, 9],
              }),
              fold(constVoid, select),
            );
          }}
        >
          select all
        </button>
        <button
          className="select-all-backward"
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            pipe(
              selection({
                anchor: [1, 0, 9],
                focus: [0, 0, 0],
              }),
              fold(constVoid, select),
            );
          }}
        >
          select all backward
        </button>
      </div>
    </>
  );
};

export default TestSelection;
