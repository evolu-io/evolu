import { useRef, useCallback } from 'react';
import { assertNever } from 'assert-never';
import { Option, fromNullable } from 'fp-ts/lib/Option';
import {
  NodesEditorPathsMap,
  EditorPathsNodesMap,
  EditorPath,
} from '../../models/path';

export type GetNodeByEditorPath = (editorPath: EditorPath) => Option<Node>;

// export type GetEditorPathByNode = (node: Node) => EditorPath | undefined;

export type SetNodeEditorPath = (
  operation: 'add' | 'remove',
  node: Node,
  path: EditorPath,
) => void;

/**
 * Mapping between nodes and editor paths. Some contentEditable editors are
 * using IDs with DOM traversal. We leverage React refs instead.
 */
export function useNodesEditorPathsMapping(): {
  nodesEditorPathsMap: NodesEditorPathsMap;
  setNodeEditorPath: SetNodeEditorPath;
  getNodeByEditorPath: GetNodeByEditorPath;
} {
  const nodesEditorPathsMapRef = useRef<NodesEditorPathsMap>(new Map());
  const editorPathsNodesMapRef = useRef<EditorPathsNodesMap>(new Map());

  const getNodeByEditorPath = useCallback<GetNodeByEditorPath>(editorPath => {
    const node = editorPathsNodesMapRef.current.get(editorPath.join());
    return fromNullable(node);
  }, []);

  const setNodeEditorPath = useCallback<SetNodeEditorPath>(
    (operation, node, path) => {
      switch (operation) {
        case 'add':
          // console.log('add', path, node);
          nodesEditorPathsMapRef.current.set(node, path);
          editorPathsNodesMapRef.current.set(path.join(), node);
          break;
        case 'remove':
          // console.log('remove', path, node);
          nodesEditorPathsMapRef.current.delete(node);
          editorPathsNodesMapRef.current.delete(path.join());
          break;
        default:
          assertNever(operation);
      }
    },
    [editorPathsNodesMapRef, nodesEditorPathsMapRef],
  );
  return {
    nodesEditorPathsMap: nodesEditorPathsMapRef.current,
    setNodeEditorPath,
    getNodeByEditorPath,
  };
}
