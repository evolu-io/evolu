import React, { Fragment, memo, useMemo, useContext } from 'react';
import { useGetReferenceKey } from '../hooks/useGetReferenceKey';
import { useSetNodePathRef } from '../hooks/useSetNodePathRef';
import { EditorTextRenderer } from './EditorTextRenderer';
import { RenderElementContext } from '../contexts/RenderElementContext';
import { Element } from '../models/element';
import { Path, pathsAreEqual } from '../models/path';

export interface EditorElementRendererProps {
  element: Element;
  path: Path;
}

export const EditorElementRenderer = memo<EditorElementRendererProps>(
  ({ element, path }) => {
    const getReferenceKey = useGetReferenceKey();
    const renderElement = useContext(RenderElementContext);
    const setNodePathRef = useSetNodePathRef(path);

    const children = useMemo(() => {
      return (
        element.children &&
        element.children.map((child, index) => {
          const key = getReferenceKey(child, index);
          const childPath: Path = [...path, index];
          return (
            <Fragment key={key}>
              {typeof child === 'string' ? (
                <EditorTextRenderer value={child} path={childPath} />
              ) : (
                <EditorElementRenderer element={child} path={childPath} />
              )}
            </Fragment>
          );
        })
      );
    }, [element.children, getReferenceKey, path]);

    return <>{renderElement(element, children, setNodePathRef)}</>;
  },
  (prevProps, nextProps) => {
    if (prevProps.element !== nextProps.element) return false;
    if (!pathsAreEqual(prevProps.path, nextProps.path)) return false;
    return true;
  },
);

EditorElementRenderer.displayName = 'EditorElementRenderer';
