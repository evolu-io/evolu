import { useContext, useCallback, useRef } from 'react';
import {
  SetNodeEditorPathContext,
  Node,
} from '../contexts/SetNodeEditorPathContext';
import { EditorPath } from '../models/path';

export type SetNodeEditorPathRef = (node: Node | null) => void;

export function useSetNodeEditorPathRef(path: EditorPath) {
  const previousNodeRef = useRef<Node | null>(null);
  const setNodePath = useContext(SetNodeEditorPathContext);
  const setNodePathRef = useCallback<SetNodeEditorPathRef>(
    node => {
      // This is like useEffect clean, but for ref.
      if (previousNodeRef.current != null) setNodePath(previousNodeRef.current);
      previousNodeRef.current = node;
      if (node) setNodePath(node, path);
    },
    [path, setNodePath],
  );
  return setNodePathRef;
}
