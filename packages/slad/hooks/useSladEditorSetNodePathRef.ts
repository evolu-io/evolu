import { useContext, useCallback, useRef } from 'react';
import {
  SladPath,
  SladEditorSetNodePathContext,
} from '../components/SladEditorSetNodePathContext';

export type SladEditorSetNodePathRef = (node: Element | Text | null) => void;

export const useSladEditorSetNodePathRef = (path: SladPath) => {
  const previousNodeRef = useRef<Element | Text | null>(null);
  const sladEditorSetNodePath = useContext(SladEditorSetNodePathContext);
  const sladEditorSetNodePathRef = useCallback<SladEditorSetNodePathRef>(
    node => {
      if (previousNodeRef.current != null)
        sladEditorSetNodePath(previousNodeRef.current);
      previousNodeRef.current = node;
      if (node) sladEditorSetNodePath(node, path);
    },
    [path, sladEditorSetNodePath],
  );
  return sladEditorSetNodePathRef;
};
