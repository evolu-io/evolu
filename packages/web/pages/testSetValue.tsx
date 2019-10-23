import {
  childrenLens,
  createValue,
  Editor,
  elementLens,
  jsx,
  move,
  select,
  setText,
  useLogValue,
  Value,
} from 'evolu';
import { foldLeft, reverse } from 'fp-ts/lib/Array';
import { fold, none, some, toNullable } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const initialValue = createValue({
  element: jsx(
    <div className="root">
      <div className="heading">heading</div>
      <div className="paragraph">paragraph</div>
    </div>,
  ),
  hasFocus: true,
});

const TestSetValue = () => {
  const [value, setValue] = useState(initialValue);

  const [logValue, logValueElement] = useLogValue(value);

  const handleEditorChange = useCallback(
    (value: Value) => {
      logValue(value);
      setValue(value);
    },
    [logValue],
  );

  const operationsRef = useRef([
    setText('foo'),
    select({ anchor: [0, 0, 0], focus: [0, 0, 2] }),
    move(1),
    elementLens.composeLens(childrenLens).modify(reverse),
    elementLens
      .composeLens(childrenLens)
      .modify(childred => childred.slice(0, 1)),
  ]);

  const [done, setDone] = useState(false);

  useEffect(() => {
    if (toNullable(value.selection) == null) return;
    pipe(
      operationsRef.current,
      foldLeft(
        () => none,
        (operation, remaining) => {
          operationsRef.current = remaining;
          return some(operation);
        },
      ),
      fold(
        () => {
          setDone(true);
        },
        operation => {
          const nextValue = operation(value);
          setTimeout(() => {
            handleEditorChange(nextValue);
          }, 10);
        },
      ),
    );
  });

  return (
    <>
      <Editor value={value} onChange={handleEditorChange} />
      {logValueElement}
      {done && <b id="done">done</b>}
    </>
  );
};

export default TestSetValue;
