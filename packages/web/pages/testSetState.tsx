import {
  childrenLens,
  createEditorState,
  Editor,
  EditorState,
  elementLens,
  isEditorStateWithSelection,
  jsx,
  move,
  select,
  setText,
  useLogEditorState,
} from 'evolu';
import { foldLeft, reverse } from 'fp-ts/lib/Array';
import { fold, none, some } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const initialEditorState = createEditorState({
  element: jsx(
    <div className="root">
      <div className="heading">heading</div>
      <div className="paragraph">paragraph</div>
    </div>,
  ),
  hasFocus: true,
});

function TestSetState() {
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
    if (!isEditorStateWithSelection(editorState)) return;
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
          const nextState = operation(editorState);
          handleEditorChange(nextState);
        },
      ),
    );
  });

  return (
    <>
      <Editor editorState={editorState} onChange={handleEditorChange} />
      {logEditorStateElement}
    </>
  );
}

export default TestSetState;
