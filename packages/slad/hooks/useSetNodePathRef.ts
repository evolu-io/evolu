import { useContext, useCallback, useRef } from 'react';
import { SetNodePathContext, Node } from '../contexts/SetNodePathContext';
import { Path } from '../models/path';

export type SetNodePathRef = (node: Node | null) => void;

export function useSetNodePathRef(path: Path) {
  const previousNodeRef = useRef<Node | null>(null);
  const setNodePath = useContext(SetNodePathContext);
  const setNodePathRef = useCallback<SetNodePathRef>(
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
