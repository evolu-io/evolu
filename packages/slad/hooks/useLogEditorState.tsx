import React, {
  useCallback,
  ReactNode,
  useState,
  useMemo,
  Fragment,
} from 'react';
import { EditorState } from '../components/Editor';

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
      <pre style={{ height: 48, overflow: 'auto' }}>
        {editorStates
          .map((editorState, index) => {
            // hasFocus, to render it first
            const { element, hasFocus, ...rest } = editorState;
            // Deliberately do not prettify. Smaller output is more readable in snapshots.
            const title = JSON.stringify(element)
              .split('"')
              .join("'");
            return (
              // eslint-disable-next-line react/no-array-index-key
              <Fragment key={index}>
                <span title={title} style={{ color: '#888' }}>
                  {index} {JSON.stringify({ hasFocus, ...rest })}
                </span>
                <br />
                <br />
              </Fragment>
            );
          })
          .reverse()}
      </pre>
    );
  }, [editorStates]);

  return [logEditorState, logEditorStateElement];
}
