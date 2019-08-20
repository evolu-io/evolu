import React, { Fragment, memo, useMemo, useContext } from 'react';
import { useGetReferenceKey } from '../hooks/useGetReferenceKey';
import { useSetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorTextRenderer } from './EditorTextRenderer';
import { RenderEditorElementContext } from '../contexts/RenderEditorElementContext';
import { EditorElement } from '../models/element';
import { EditorPath, editorPathsAreEqual } from '../models/path';

export interface EditorElementRendererProps {
  element: EditorElement;
  path: EditorPath;
}

export const EditorElementRenderer = memo<EditorElementRendererProps>(
  ({ element, path }) => {
    const getReferenceKey = useGetReferenceKey();
    const renderElement = useContext(RenderEditorElementContext);
    const setNodePathRef = useSetNodeEditorPathRef(path);

    const children = useMemo(() => {
      return (
        element.children &&
        element.children.map((child, index) => {
          const key = getReferenceKey(child, index);
          const childPath: EditorPath = [...path, index];
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
    if (!editorPathsAreEqual(prevProps.path, nextProps.path)) return false;
    return true;
  },
);

EditorElementRenderer.displayName = 'EditorElementRenderer';
