import React, { createElement, Children } from 'react';
import {
  RenderEditorElement,
  EditorElement,
  EditorDOMElement,
} from '../models/element';
import { isEditorText } from '../models/text';

export const renderEditorDOMElement: RenderEditorElement = (
  element,
  children,
  ref,
) => {
  const { tag, props } = element as EditorDOMElement;
  // To bypass React void elements invariant violation.
  // We don't want to pass children are many args because they already have keys.
  if (Children.count(children) === 0) {
    return createElement(tag, { ...props, ref });
  }
  return createElement(tag, { ...props, ref }, children);
};

function refNoop() {
  // do nothing
}

export interface EditorServerProps<T extends EditorElement> {
  element: T;
  renderElement?: RenderEditorElement;
}

export function EditorServerElement<T extends EditorElement>({
  element,
  renderElement,
}: EditorServerProps<T>) {
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
  return <>{renderEditorDOMElement(element, children, refNoop)}</>;
}

/**
 * Just render. No edit. Good for performance and tree shaking.
 */
export function EditorServer<T extends EditorElement>({
  element,
  renderElement,
}: EditorServerProps<T>) {
  return (
    <EditorServerElement element={element} renderElement={renderElement} />
  );
}
