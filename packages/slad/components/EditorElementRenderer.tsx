import React, { memo, useMemo, useContext, useCallback, useRef } from 'react';
import invariant from 'tiny-invariant';
import {
  useSetNodeEditorPathRef,
  SetNodeEditorPathRef,
} from '../hooks/useSetNodeEditorPathRef';
import { EditorTextRenderer } from './EditorTextRenderer';
import { RenderEditorElementContext } from '../contexts/RenderEditorElementContext';
import { EditorElement } from '../models/element';
import { EditorPath, editorPathsAreEqual } from '../models/path';
import { isEditorText } from '../models/text';

// We can not magically add data-foo prop, because it would mutate DOM.
// Better to enforce the right data model. Check invariant message.
// TODO: It seems we do not need it with beforeinput preventDefault, not even
// for IME! Manually tested. But do not remove it yet since it does not harm.
// http://jsfiddle.net/pdrmv48b/
export function invariantHTMLElementHasToHaveAtLeastOneAttribute(
  element: HTMLElement,
) {
  if (process.env.NODE_ENV !== 'production') {
    invariant(
      element.hasAttributes(),
      "Editor element has to have at least one attribute. That's because contentEditable " +
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
    const elementRef = useRef<HTMLElement | null>(null);
    const handleElementRef = useCallback<SetNodeEditorPathRef>(
      node => {
        if (node)
          invariantHTMLElementHasToHaveAtLeastOneAttribute(node as HTMLElement);
        elementRef.current = node as HTMLElement;
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
              // We are passing parent ref element, so EditorTextRenderer can read
              // from DOM, to check whether it needs to touch it.
              // https://twitter.com/steida/status/1177610944106651653
              parentRef={elementRef}
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
    if (!editorPathsAreEqual(prevProps.path, nextProps.path)) return false;
    if (prevProps.element !== nextProps.element) return false;
    return true;
  },
);

EditorElementRenderer.displayName = 'EditorElementRenderer';
