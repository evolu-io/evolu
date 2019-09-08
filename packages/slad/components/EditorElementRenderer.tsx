import React, { memo, useMemo, useContext } from 'react';
import { useSetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorTextRenderer } from './EditorTextRenderer';
import { RenderEditorElementContext } from '../contexts/RenderEditorElementContext';
import { EditorElement, isEditorText } from '../models/element';
import { EditorPath, editorPathsAreEqual } from '../models/path';

export interface EditorElementRendererProps {
  element: EditorElement;
  path: EditorPath;
}

export const EditorElementRenderer = memo<EditorElementRendererProps>(
  ({ element, path }) => {
    const renderElement = useContext(RenderEditorElementContext);
    const setNodePathRef = useSetNodeEditorPathRef(path);

    const children = useMemo(() => {
      return element.children.map((child, index) => {
        const childPath: EditorPath = [...path, index];
        if (isEditorText(child)) {
          return (
            <EditorTextRenderer
              key={child.id}
              text={child.text}
              path={childPath}
            />
          );
        }
        return (
          <EditorElementRenderer
            key={child.id}
            element={child}
            path={childPath}
          />
        );
      });
    }, [element.children, path]);

    return <>{renderElement(element, children, setNodePathRef)}</>;
  },
  (prevProps, nextProps) => {
    if (prevProps.element !== nextProps.element) return false;
    if (!editorPathsAreEqual(prevProps.path, nextProps.path)) return false;
    return true;
  },
);

EditorElementRenderer.displayName = 'EditorElementRenderer';
