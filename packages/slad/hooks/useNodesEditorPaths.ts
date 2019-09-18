import { useRef, useCallback } from 'react';
import { assertNever } from 'assert-never';
import { NodesEditorPathsMap, EditorPathsNodesMap } from '../models/path';
import { SetNodeEditorPath } from '../contexts/SetNodeEditorPathContext';

export function useNodesEditorPaths(): {
  nodesEditorPathsMap: NodesEditorPathsMap;
  editorPathsNodesMap: EditorPathsNodesMap;
  setNodeEditorPath: SetNodeEditorPath;
} {
  // Nodes references to paths via React ref instead of explicit IDs in DOM.
  const nodesEditorPathsMap = useRef<NodesEditorPathsMap>(new Map()).current;
  const editorPathsNodesMap = useRef<EditorPathsNodesMap>(new Map()).current;
  const setNodeEditorPath = useCallback<SetNodeEditorPath>(
    (operation, node, path) => {
      switch (operation) {
        case 'add':
          nodesEditorPathsMap.set(node, path);
          editorPathsNodesMap.set(path.join(), node);
          break;
        case 'remove':
          nodesEditorPathsMap.delete(node);
          editorPathsNodesMap.delete(path.join());
          break;
        default:
          assertNever(operation);
      }
    },
    [editorPathsNodesMap, nodesEditorPathsMap],
  );
  return { nodesEditorPathsMap, editorPathsNodesMap, setNodeEditorPath };
}
