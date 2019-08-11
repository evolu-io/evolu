import { useContext, useCallback, useRef } from 'react';
import {
  SladPath,
  SladEditorSetNodePathContext,
  Node,
} from '../components/SladEditorSetNodePathContext';

export type SladEditorSetNodePathRef = (node: Node | null) => void;

export const useSladEditorSetNodePathRef = (path: SladPath) => {
  const previousNodeRef = useRef<Node | null>(null);
  const sladEditorSetNodePath = useContext(SladEditorSetNodePathContext);
  const sladEditorSetNodePathRef = useCallback<SladEditorSetNodePathRef>(
    node => {
      // This is like useEffect clean, but for ref.
      if (previousNodeRef.current != null)
        sladEditorSetNodePath(previousNodeRef.current);
      previousNodeRef.current = node;
      if (node) sladEditorSetNodePath(node, path);
    },
    [path, sladEditorSetNodePath],
  );
  return sladEditorSetNodePathRef;
};
