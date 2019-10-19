import React, { memo, useCallback, useMemo } from 'react';
import { useRenderEditorElement } from '../hooks/useRenderEditorElement';
import { useSetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorElement } from '../models/element';
import {
  SetNodeEditorPathRef,
  isHTMLElement,
  editorNodeIDToString,
} from '../models/node';
import { EditorPath, eqEditorPath } from '../models/path';
import { isEditorText } from '../models/text';
import { EditorTextRenderer } from './EditorTextRenderer';
import { warn } from '../warn';

export interface EditorElementRendererProps {
  element: EditorElement;
  path: EditorPath;
}

export const EditorElementRenderer = memo<EditorElementRendererProps>(
  ({ element, path }) => {
    const renderElement = useRenderEditorElement();
    const setNodeEditorPathRef = useSetNodeEditorPathRef(path);
    const handleElementRef = useCallback<SetNodeEditorPathRef>(
      node => {
        if (process.env.NODE_ENV !== 'production') {
          if (node && isHTMLElement(node) && !node.hasAttributes())
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
        setNodeEditorPathRef(node);
      },
      [setNodeEditorPathRef],
    );

    const children = useMemo(() => {
      return element.children.map((child, index) => {
        const childPath: EditorPath = [...path, index];
        if (isEditorText(child)) {
          return (
            <EditorTextRenderer
              key={editorNodeIDToString(child.id)}
              text={child.text}
              path={childPath}
            />
          );
        }
        return (
          <EditorElementRenderer
            key={editorNodeIDToString(child.id)}
            element={child}
            path={childPath}
          />
        );
      });
    }, [element.children, path]);

    return <>{renderElement(element, children, handleElementRef)}</>;
  },
  (prevProps, nextProps) => {
    if (!eqEditorPath.equals(prevProps.path, nextProps.path)) return false;
    if (prevProps.element !== nextProps.element) return false;
    return true;
  },
);

EditorElementRenderer.displayName = 'EditorElementRenderer';
