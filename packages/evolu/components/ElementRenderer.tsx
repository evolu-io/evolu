import React, { memo, useCallback, useMemo } from 'react';
import { empty } from 'fp-ts/lib/Array';
import { snoc } from 'fp-ts/lib/NonEmptyArray';
import { useRenderElement } from '../hooks/useRenderElement';
import { useSetDOMNodePathRef } from '../hooks/useSetDOMNodePathRef';
import { eqPath } from '../models/path';
import { isText } from '../models/text';
import { TextRenderer } from './TextRenderer';
import { warn } from '../warn';
import { isDOMElement } from '../models/dom';
import { Element, Path, SetDOMNodePathRef, PathMaybeEmpty } from '../types';
import { createKeyForElement } from '../models/element';

export const ElementRenderer = memo<{
  element: Element;
  path: PathMaybeEmpty;
}>(
  ({ element, path = empty }) => {
    const renderElement = useRenderElement();
    const setDOMNodePathRef = useSetDOMNodePathRef(path);
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
        setDOMNodePathRef(node);
      },
      [setDOMNodePathRef],
    );

    const children = useMemo(() => {
      return element.children.map((child, index) => {
        const childPath: Path = snoc(path, index);
        if (isText(child)) {
          return (
            <TextRenderer
              key={index.toString()}
              text={child}
              path={childPath}
            />
          );
        }
        return (
          <ElementRenderer
            key={createKeyForElement(child)}
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
