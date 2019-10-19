import { fromNullable } from 'fp-ts/lib/Option';
import { useCallback, useEffect, useRef } from 'react';
import { absurd } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import { EditorElement, EditorElementChild } from '../models/element';
import {
  GetNodeByEditorPath,
  SetNodeEditorPath,
  GetEditorPathByNode,
  EditorPath,
  EditorPathString,
  editorPathToString,
} from '../models/path';
import { isEditorText } from '../models/text';
import { warn } from '../warn';

type NodesEditorPathsMap = Map<Node, EditorPath>;
type EditorPathsNodesMap = Map<EditorPathString, Node>;

function useDebugNodesEditorPaths(
  nodesEditorPathsMap: NodesEditorPathsMap,
  element: EditorElement,
) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      // const nodes: [string, Node][] = [];
      // nodesEditorPathsMap.forEach((path, node) => {
      //   nodes.push([path.join(), node]);
      // });
      // console.log(nodes);
      const countNodes = (child: EditorElementChild, count = 0) => {
        if (isEditorText(child)) return count + 1;
        let childrenCount = 0;
        if (child.children)
          child.children.forEach(child => {
            childrenCount += countNodes(child, count);
          });
        return count + 1 + childrenCount;
      };
      const nodesLength = countNodes(element);
      // console.log(nodesLength, nodesEditorPathsMap.size);
      if (nodesLength !== nodesEditorPathsMap.size)
        warn(
          'It looks like the ref arg in the custom renderElement is not used.',
        );
    }, [nodesEditorPathsMap, element]);
  }
}

/**
 * Mapping between nodes and editor paths. Some contentEditable editors are
 * using IDs with DOM traversal. We leverage React refs instead.
 */
export function useNodesEditorPathsMapping(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  element: EditorElement,
): {
  setNodeEditorPath: SetNodeEditorPath;
  getNodeByEditorPath: GetNodeByEditorPath;
  getEditorPathByNode: GetEditorPathByNode;
} {
  const nodesEditorPathsMapRef = useRef<NodesEditorPathsMap>(new Map());
  const editorPathsNodesMapRef = useRef<EditorPathsNodesMap>(new Map());

  useDebugNodesEditorPaths(nodesEditorPathsMapRef.current, element);

  const getNodeByEditorPath = useCallback<GetNodeByEditorPath>(editorPath => {
    return pipe(
      editorPathsNodesMapRef.current.get(editorPathToString(editorPath)),
      fromNullable,
    );
  }, []);

  const getEditorPathByNode = useCallback<GetEditorPathByNode>(node => {
    return pipe(
      nodesEditorPathsMapRef.current.get(node),
      fromNullable,
    );
  }, []);

  const setNodeEditorPath = useCallback<SetNodeEditorPath>(
    (operation, node, path) => {
      switch (operation) {
        case 'add':
          nodesEditorPathsMapRef.current.set(node, path);
          editorPathsNodesMapRef.current.set(editorPathToString(path), node);
          break;
        case 'remove':
          nodesEditorPathsMapRef.current.delete(node);
          editorPathsNodesMapRef.current.delete(editorPathToString(path));
          break;
        default:
          absurd(operation);
      }
    },
    [editorPathsNodesMapRef, nodesEditorPathsMapRef],
  );
  return {
    setNodeEditorPath,
    getNodeByEditorPath,
    getEditorPathByNode,
  };
}
