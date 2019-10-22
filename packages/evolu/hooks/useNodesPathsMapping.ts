import { fromNullable, Option } from 'fp-ts/lib/Option';
import { useCallback, useEffect, useRef } from 'react';
import { absurd } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import { Element, ElementChild } from '../models/element';
import { Path } from '../models/path';
import { isText } from '../models/text';
import { warn } from '../warn';
import { DOMNode } from '../models/dom';

export type SetDOMNodePath = (
  operation: 'add' | 'remove',
  node: DOMNode,
  path: Path,
) => void;

const useDebugNodesPaths = (
  nodesPathsMap: Map<DOMNode, Path>,
  element: Element,
) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      // const nodes: [string, Node][] = [];
      // nodesPathsMap.forEach((path, node) => {
      //   nodes.push([path.join(), node]);
      // });
      // console.log(nodes);
      const countNodes = (child: ElementChild, count = 0) => {
        if (isText(child)) return count + 1;
        let childrenCount = 0;
        if (child.children)
          child.children.forEach(child => {
            childrenCount += countNodes(child, count);
          });
        return count + 1 + childrenCount;
      };
      const nodesLength = countNodes(element);
      // console.log(nodesLength, nodesPathsMap.size);
      if (nodesLength !== nodesPathsMap.size)
        warn(
          'It looks like the ref arg in the custom renderElement is not used.',
        );
    }, [nodesPathsMap, element]);
  }
};

/**
 * Mapping between nodes and paths. Some contentEditable editors are
 * using IDs with DOM traversal. We leverage React refs instead.
 */
export const useNodesPathsMapping = (
  element: Element,
): {
  setDOMNodePath: SetDOMNodePath;
  getDOMNodeByPath: (path: Path) => Option<DOMNode>;
  getPathByDOMNode: (node: DOMNode) => Option<Path>;
} => {
  const nodesPathsMapRef = useRef<Map<DOMNode, Path>>(new Map());
  const pathsNodesMapRef = useRef<Map<string, DOMNode>>(new Map());

  useDebugNodesPaths(nodesPathsMapRef.current, element);

  const getDOMNodeByPath = useCallback<(path: Path) => Option<DOMNode>>(
    path => {
      return pipe(
        pathsNodesMapRef.current.get(path.join()),
        fromNullable,
      );
    },
    [],
  );

  const getPathByDOMNode = useCallback<(node: DOMNode) => Option<Path>>(
    node => {
      return pipe(
        nodesPathsMapRef.current.get(node),
        fromNullable,
      );
    },
    [],
  );

  const setDOMNodePath = useCallback<SetDOMNodePath>(
    (operation, node, path) => {
      switch (operation) {
        case 'add':
          nodesPathsMapRef.current.set(node, path);
          pathsNodesMapRef.current.set(path.join(), node);
          break;
        case 'remove':
          nodesPathsMapRef.current.delete(node);
          pathsNodesMapRef.current.delete(path.join());
          break;
        default:
          absurd(operation);
      }
    },
    [pathsNodesMapRef, nodesPathsMapRef],
  );
  return {
    setDOMNodePath,
    getDOMNodeByPath,
    getPathByDOMNode,
  };
};
