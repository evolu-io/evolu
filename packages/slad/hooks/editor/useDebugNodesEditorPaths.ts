import { useEffect } from 'react';
import invariant from 'tiny-invariant';
import { NodesEditorPathsMap } from '../../models/path';
import { EditorElement, EditorElementChild } from '../../models/element';
import { isEditorText } from '../../models/text';

export function useDebugNodesEditorPaths(
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

      invariant(
        nodesLength === nodesEditorPathsMap.size,
        'It looks like the ref in the custom renderElement of Editor is not used.',
      );
    }, [nodesEditorPathsMap, element]);
  }
}
