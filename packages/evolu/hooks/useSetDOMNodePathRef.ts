import { useContext, useCallback, useRef, createContext } from 'react';
import { Path } from '../models/path';
import { SetDOMNodePathRef } from '../models/dom';
import { SetDOMNodePath } from './useNodesPathsMapping';

export const SetNodePathContext = createContext<SetDOMNodePath>(() => {});

export const useSetDOMNodePathRef = (path: Path) => {
  const previousRef = useRef<{ node: Node; path: Path } | null>(null);
  const setNodePath = useContext(SetNodePathContext);
  const setNodePathRef = useCallback<SetDOMNodePathRef>(
    node => {
      if (previousRef.current != null) {
        const { node, path } = previousRef.current;
        setNodePath('remove', node, path);
        previousRef.current = null;
      }
      if (node) {
        previousRef.current = { node, path };
        setNodePath('add', node, path);
      }
    },
    [path, setNodePath],
  );
  return setNodePathRef;
};
