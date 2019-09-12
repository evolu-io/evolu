import React, { memo, useMemo, useContext, useCallback } from 'react';
import invariant from 'tiny-invariant';
import {
  useSetNodeEditorPathRef,
  SetNodeEditorPathRef,
} from '../hooks/useSetNodeEditorPathRef';
import { EditorTextRenderer } from './EditorTextRenderer';
import { RenderEditorElementContext } from '../contexts/RenderEditorElementContext';
import { EditorElement, isEditorText } from '../models/element';
import { EditorPath, editorPathsAreEqual } from '../models/path';

// We can not magically add data-foo prop, because it would mutate DOM.
// Better to enforce right data model.
export function invariantHTMLElementHasAttributes(element: HTMLElement) {
  if (process.env.NODE_ENV !== 'production') {
    invariant(
      element.hasAttributes(),
      "HTML element has to have at least one attribute. That's because contentEditable " +
        'does not like naked elements. For inline elements, it can split or wrap nodes. ' +
        'Check https://git.io/Jemyy. ' +
        'For block elements, it can remove then add parents on text mutation. ' +
        'The fix is simple. Use classes instead of tags. For example, instead of ' +
        '<b>, use <div class="strong">. Affected element: ' +
        `${element.outerHTML}`,
    );
  }
}

export interface EditorElementRendererProps {
  element: EditorElement;
  path: EditorPath;
}

export const EditorElementRenderer = memo<EditorElementRendererProps>(
  ({ element, path }) => {
    const renderElement = useContext(RenderEditorElementContext);
    const setNodePathRef = useSetNodeEditorPathRef(path);
    const handleElementRef = useCallback<SetNodeEditorPathRef>(
      node => {
        if (node) invariantHTMLElementHasAttributes(node as HTMLElement);
        setNodePathRef(node);
      },
      [setNodePathRef],
    );

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

    return <>{renderElement(element, children, handleElementRef)}</>;
  },
  (prevProps, nextProps) => {
    if (prevProps.element !== nextProps.element) return false;
    if (!editorPathsAreEqual(prevProps.path, nextProps.path)) return false;
    return true;
  },
);

EditorElementRenderer.displayName = 'EditorElementRenderer';
