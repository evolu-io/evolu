import React, { useCallback, useEffect, useState, useRef } from 'react';
import { pipe } from 'fp-ts/lib/pipeable';
import {
  useLogEditorState,
  createEditorState,
  jsx,
  EditorState,
  isEditorStateWithSelection,
  setText,
  select,
  move,
  Editor,
} from 'evolu';

const initialEditorState = createEditorState({
  element: jsx(
    <div className="root">
      {/* <div className="heading">heading</div> */}
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

  const onceRef = useRef(false);

  useEffect(() => {
    if (!isEditorStateWithSelection(editorState) || onceRef.current) return;
    onceRef.current = true;

    const nextState = pipe(
      editorState,
      setText('foo'),
      select({ anchor: [0, 0, 0], focus: [0, 0, 2] }),
      move(1),
    );

    handleEditorChange(nextState);
  }, [editorState, handleEditorChange]);

  return (
    <>
      <Editor editorState={editorState} onChange={handleEditorChange} />
      {logEditorStateElement}
    </>
  );
}

export default TestSetState;
