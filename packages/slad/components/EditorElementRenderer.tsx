import React, { memo, useMemo, useContext } from 'react';
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
      if (element.children == null) return null;
      return element.children.map((child, index) => {
        const childPath: EditorPath = [...path, index];
        if (typeof child === 'string') {
          return (
            // Text indentity is index because we have to compare text with actual DOM.
            // eslint-disable-next-line react/no-array-index-key
            <EditorTextRenderer key={index} text={child} path={childPath} />
          );
        }
        const key = getReferenceKey(child);
        return (
          <EditorElementRenderer key={key} element={child} path={childPath} />
        );
      });
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
