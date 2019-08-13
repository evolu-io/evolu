import { useRef, useEffect } from 'react';
import Debug from 'debug';
import invariant from 'tiny-invariant';
import { Element } from '../models/element';
import { Path } from '../models/path';
import { Value } from '../models/value';

export type NodesPathsMap = Map<Node, Path>;

const debug = Debug('editor');

export const useDevDebug = (
  nodesPathsMap: NodesPathsMap,
  value: Value<Element>,
) => {
  // https://overreacted.io/how-does-the-development-mode-work/
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const nodes: [string, Node][] = [];
      nodesPathsMap.forEach((path, node) => {
        nodes.push([path.join(), node]);
      });
      debug('nodesPathsMap after render', nodes);

      const countNodes = (node: Element | string, count = 0) => {
        if (typeof node === 'string') return count + 1;
        let childrenCount = 0;
        if (node.children)
          node.children.forEach(child => {
            childrenCount += countNodes(child, count);
          });
        return count + 1 + childrenCount;
      };
      const nodesLength = countNodes(value.element);
      invariant(
        nodesLength === nodesPathsMap.size,
        'It looks like you forgot to use ref in custom renderElement of Editor.',
      );
    }, [nodesPathsMap, value.element]);
  }
};

export const useNodesPathsMap = (value: Value<Element>): NodesPathsMap => {
  // https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
  const nodesPathsMapRef = useRef<NodesPathsMap | null>(null);
  if (nodesPathsMapRef.current == null) nodesPathsMapRef.current = new Map();
  useDevDebug(nodesPathsMapRef.current, value);
  return nodesPathsMapRef.current;
};
