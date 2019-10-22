import React, { memo, useCallback, useMemo } from 'react';
import { useRenderElement } from '../hooks/useRenderElement';
import { useSetDOMNodePathRef } from '../hooks/useSetDOMNodePathRef';
import { Element } from '../models/element';
import { mapNodeIDToString } from '../models/node';
import { Path, eqPath } from '../models/path';
import { isText } from '../models/text';
import { TextRenderer } from './TextRenderer';
import { warn } from '../warn';
import { SetDOMNodePathRef, isDOMElement } from '../models/dom';

export interface ElementRendererProps {
  element: Element;
  path: Path;
}

export const ElementRenderer = memo<ElementRendererProps>(
  ({ element, path }) => {
    const renderElement = useRenderElement();
    const setNodePathRef = useSetDOMNodePathRef(path);
    const handleElementRef = useCallback<SetDOMNodePathRef>(
      node => {
        if (process.env.NODE_ENV !== 'production') {
          // Maybe we can fix it manually somehow, but it has very low priority,
          // because nobody is using elements without class or style attributes.
          if (node && isDOMElement(node) && !node.hasAttributes())
            warn(
              'Element rendered by editor has to have at least one attribute. ' +
                "That's because contentEditable does not like naked elements. " +
                'For inline elements, it can split or wrap nodes. ' +
                'Check https://git.io/Jemyy. ' +
                'For block elements, it can remove then add parents on text mutation. ' +
                'The fix is simple. Use classes instead of tags. For example, instead of ' +
                '<b>, use <div class="strong">. Affected element: ' +
                `${node.outerHTML}`,
            );
        }
        setNodePathRef(node);
      },
      [setNodePathRef],
    );

    const children = useMemo(() => {
      return element.children.map((child, index) => {
        const childPath: Path = [...path, index];
        if (isText(child)) {
          return (
            <TextRenderer
              key={mapNodeIDToString(child.id)}
              text={child.text}
              path={childPath}
            />
          );
        }
        return (
          <ElementRenderer
            key={mapNodeIDToString(child.id)}
            element={child}
            path={childPath}
          />
        );
      });
    }, [element.children, path]);

    return <>{renderElement(element, children, handleElementRef)}</>;
  },
  (prevProps, nextProps) => {
    if (!eqPath.equals(prevProps.path, nextProps.path)) return false;
    if (prevProps.element !== nextProps.element) return false;
    return true;
  },
);

ElementRenderer.displayName = 'ElementRenderer';
