import React, { useCallback, useEffect, useState, useRef } from 'react';
import * as editor from 'evolu';
import { pipe } from 'fp-ts/lib/pipeable';
import { isNone } from 'fp-ts/lib/Option';

const initialEditorState = editor.createEditorState({
  element: editor.jsx(
    <div className="root">
      {/* <div className="heading">heading</div> */}
      <div className="paragraph">paragraph</div>
    </div>,
  ),
  hasFocus: true,
});

function TestSetState() {
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

  const onceRef = useRef(false);

  useEffect(() => {
    if (isNone(editorState.selection) || onceRef.current) return;
    onceRef.current = true;

    const nextState = pipe(
      editorState,
      editor.setText('foo'),
      editor.select({ anchor: [0, 0, 0], focus: [0, 0, 2] }),
      editor.move(1),
    );

    handleEditorChange(nextState);
  }, [editorState, handleEditorChange]);

  return (
    <>
      <editor.Editor editorState={editorState} onChange={handleEditorChange} />
      {logEditorStateElement}
    </>
  );
}

export default TestSetState;
