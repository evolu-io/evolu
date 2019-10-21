import {
  childrenLens,
  createState,
  Editor,
  State,
  elementLens,
  isStateWithSelection,
  jsx,
  move,
  select,
  setText,
  useLogState,
} from 'evolu';
import { foldLeft, reverse } from 'fp-ts/lib/Array';
import { fold, none, some } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const initialState = createState({
  element: jsx(
    <div className="root">
      <div className="heading">heading</div>
      <div className="paragraph">paragraph</div>
    </div>,
  ),
  hasFocus: true,
});

function TestSetState() {
  const [state, setState] = useState(initialState);

  const [logState, logStateElement] = useLogState(state);

  const handleEditorChange = useCallback(
    (state: State) => {
      logState(state);
      setState(state);
    },
    [logState],
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

  useEffect(() => {
    if (!isStateWithSelection(state)) return;
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
          // TODO: Here, we should call Puppeter somehow.
        },
        operation => {
          const nextState = operation(state);
          handleEditorChange(nextState);
        },
      ),
    );
  });

  return (
    <>
      <Editor state={state} onChange={handleEditorChange} />
      {logStateElement}
    </>
  );
}

export default TestSetState;
