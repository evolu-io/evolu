import { useContext, useCallback, useRef } from 'react';
import {
  SetNodeEditorPathContext,
  Node,
} from '../contexts/SetNodeEditorPathContext';
import { EditorPath } from '../models/path';

export type SetNodeEditorPathRef = (node: Node | null) => void;

export function useSetNodeEditorPathRef(path: EditorPath) {
  const previousRef = useRef<{ node: Node; path: EditorPath } | null>(null);
  const setNodeEditorPath = useContext(SetNodeEditorPathContext);
  const setNodeEditorPathRef = useCallback<SetNodeEditorPathRef>(
    node => {
      if (previousRef.current != null) {
        const { node, path } = previousRef.current;
        setNodeEditorPath('remove', node, path);
        previousRef.current = null;
      }
      if (node) {
        previousRef.current = { node, path };
        setNodeEditorPath('add', node, path);
      }
    },
    [path, setNodeEditorPath],
  );
  return setNodeEditorPathRef;
}
