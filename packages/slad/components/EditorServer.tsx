import React, { createElement, Children } from 'react';
import {
  RenderEditorElement,
  EditorElement,
  EditorReactElement,
} from '../models/element';
import { isEditorText } from '../models/text';

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

export function refNoop() {
  // do nothing
}

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
      return child.text.length === 0 ? <br key={child.id} /> : child.text;
    }
    return (
      <EditorServerElement
        element={child}
        renderElement={renderElement}
        key={child.id}
      />
    );
  });
  if (renderElement) {
    return <>{renderElement(element, children, refNoop)}</>;
  }
  return <>{renderEditorReactElement(element, children, refNoop)}</>;
}

export type UsefulReactDivAtttributesServer = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  'className' | 'id' | 'style'
>;

/**
 * Just render. No edit. Good for performance and tree shaking.
 */
export function EditorServer({
  element,
  renderElement,
  ...rest
}: EditorServerProps & UsefulReactDivAtttributesServer) {
  return (
    <div {...rest}>
      <EditorServerElement element={element} renderElement={renderElement} />
    </div>
  );
}
