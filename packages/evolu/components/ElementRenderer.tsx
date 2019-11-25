import { empty } from 'fp-ts/lib/Array';
import { constNull } from 'fp-ts/lib/function';
import { snoc } from 'fp-ts/lib/NonEmptyArray';
import { fold } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import React, { memo, useCallback, useMemo } from 'react';
import { useRenderElement } from '../hooks/useRenderElement';
import { useSetDOMNodePathRef } from '../hooks/useSetDOMNodePathRef';
import { isDOMElement } from '../models/dom';
import { createKeyForElement } from '../models/element';
import { eqPath, pathIndex } from '../models/path';
import { isText } from '../models/text';
import { Element, Path, SetDOMNodePathRef } from '../types';
import { warn } from '../warn';
import { TextRenderer } from './TextRenderer';

export const ElementRenderer = memo<{
  element: Element;
  path: Path;
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

    const children = useMemo(
      () =>
        element.children.map((child, index) =>
          pipe(
            pathIndex(index),
            fold(constNull, index => {
              const childPath = snoc(path, index);
              return isText(child) ? (
                <TextRenderer
                  key={index.toString()}
                  text={child}
                  path={childPath}
                />
              ) : (
                <ElementRenderer
                  key={createKeyForElement(child)}
                  element={child}
                  path={childPath}
                />
              );
            }),
          ),
        ),
      [element.children, path],
    );

    return <>{renderElement(element, children, handleElementRef)}</>;
  },
  (prevProps, nextProps) => {
    if (!eqPath.equals(prevProps.path, nextProps.path)) return false;
    if (prevProps.element !== nextProps.element) return false;
    return true;
  },
);

ElementRenderer.displayName = 'ElementRenderer';
