import React, { createElement, Children, memo } from 'react';
import { constVoid } from 'fp-ts/lib/function';
import {
  RenderEditorElement,
  EditorElement,
  EditorReactElement,
  normalizeEditorElement,
} from '../models/element';
import { isEditorText } from '../models/text';
import { editorNodeIDToString } from '../models/node';

export const renderEditorReactElement: RenderEditorElement = (
  element,
  children,
  ref,
) => {
  const { tag, props } = element as EditorReactElement;
  // To bypass React void elements invariant violation.
  // We don't want to pass children are many args because they already have keys.
  if (Children.count(children) === 0) {
    return createElement(tag, { ...props, ref });
  }
  return createElement(tag, { ...props, ref }, children);
};

export interface EditorServerProps {
  element: EditorElement;
  renderElement?: RenderEditorElement;
}

export function EditorServerElement({
  element,
  renderElement,
}: EditorServerProps) {
  const children = element.children.map(child => {
    if (isEditorText(child)) {
      return child.text.length === 0 ? (
        <br key={editorNodeIDToString(child.id)} />
      ) : (
        child.text
      );
    }
    return (
      <EditorServerElement
        element={child}
        renderElement={renderElement}
        key={editorNodeIDToString(child.id)}
      />
    );
  });
  if (renderElement) {
    return <>{renderElement(element, children, constVoid)}</>;
  }
  return <>{renderEditorReactElement(element, children, constVoid)}</>;
}

export type UsefulReactDivAtttributesServer = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  'className' | 'id' | 'style'
>;

/**
 * Just render. No edit. Good for performance and tree shaking.
 */
export const EditorServer = memo<
  EditorServerProps & UsefulReactDivAtttributesServer
>(({ element, renderElement, ...rest }) => {
  const normalizedElement = normalizeEditorElement(element);
  return (
    <div {...rest}>
      <EditorServerElement
        element={normalizedElement}
        renderElement={renderElement}
      />
    </div>
  );
});

EditorServer.displayName = 'EditorServer';
