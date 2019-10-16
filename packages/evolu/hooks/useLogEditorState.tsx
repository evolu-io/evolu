import React, { useCallback, ReactNode, useState, useMemo, memo } from 'react';
import { EditorElement, recursiveRemoveID } from '../models/element';
import { EditorState, EditorStateWithSelection } from '../models/state';

const Item = memo(
  ({ editorState, index }: { editorState: EditorState; index: number }) => {
    const {
      element,
      hasFocus,
      selection,
    } = editorState as EditorStateWithSelection;
    const indexItem = { hasFocus, selection };
    // Deliberately do not prettify. Smaller output is more readable in snapshots.
    // No IDs because that would break integration tests.
    const title = JSON.stringify(recursiveRemoveID(element as EditorElement))
      .split('"')
      .join("'");
    return (
      <span title={title}>
        {index} {JSON.stringify(indexItem)}
        <style jsx>{`
          span {
            color: #888;
            display: block;
            line-height: 24px;
          }
        `}</style>
      </span>
    );
  },
);

export function useLogEditorState(
  editorState: EditorState,
): [(editorState: EditorState) => void, ReactNode] {
  const [editorStates, setEditorStates] = useState<EditorState[]>([
    editorState,
  ]);
  const logEditorState = useCallback((editorState: EditorState) => {
    setEditorStates(prevEditorStates => [...prevEditorStates, editorState]);
  }, []);

  const logEditorStateElement = useMemo(() => {
    return (
      <pre>
        {editorStates
          .map((editorState, index) => {
            // Key index is ok, because the order is stable.
            // eslint-disable-next-line react/no-array-index-key
            return <Item editorState={editorState} index={index} key={index} />;
          })
          .reverse()}
        <style jsx>{`
          pre {
            height: 48px;
            overflow: auto;
          }
          span {
            color: #888;
          }
        `}</style>
      </pre>
    );
  }, [editorStates]);

  return [logEditorState, logEditorStateElement];
}
