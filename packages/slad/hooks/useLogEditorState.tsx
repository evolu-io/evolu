import React, { useCallback, ReactNode, useState, useMemo, memo } from 'react';
import { EditorState } from '../components/Editor';
import { EditorElement, recursiveRemoveID } from '../models/element';

const Item = memo(
  <T extends EditorElement>({
    editorState,
    index,
  }: {
    editorState: EditorState<T>;
    index: number;
  }) => {
    // hasFocus render first
    const { element, hasFocus, ...rest } = editorState;
    // Deliberately do not prettify. Smaller output is more readable in snapshots.
    // No IDs because that would break integration tests.
    const title = JSON.stringify(recursiveRemoveID(element))
      .split('"')
      .join("'");
    return (
      <span title={title}>
        {index} {JSON.stringify({ hasFocus, ...rest })}
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

export function useLogEditorState<T extends EditorElement>(
  editorState: EditorState<T>,
): [(editorState: EditorState<T>) => void, ReactNode] {
  const [editorStates, setEditorStates] = useState<EditorState<T>[]>([
    editorState,
  ]);
  const logEditorState = useCallback((editorState: EditorState<T>) => {
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
