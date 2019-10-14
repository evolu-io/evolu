import { useContext, useCallback, useRef, createContext } from 'react';
import { EditorPath, SetNodeEditorPath } from '../models/path';
import { SetNodeEditorPathRef } from '../models/node';

export const SetNodeEditorPathContext = createContext<SetNodeEditorPath>(
  () => {},
);

export function useSetNodeEditorPathRef(path: EditorPath) {
  const previousRef = useRef<{ node: Node; path: EditorPath } | null>(null);
  const setNodeEditorPath = useContext(SetNodeEditorPathContext);
  const setNodeEditorPathRef = useCallback<SetNodeEditorPathRef>(
    node => {
      // TODO: Simplify? Do we really need previousRef?
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
