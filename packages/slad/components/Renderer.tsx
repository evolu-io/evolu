import React, { createElement } from 'react';
import {
  RenderEditorElement,
  EditorElement,
  isEditorText,
} from '../models/element';

export interface RendererProps<T extends EditorElement> {
  element: T;
  renderElement?: RenderEditorElement;
}

/**
 * Just render. No edit behaviour. Good for performance and tree shaking.
 */
export function Renderer<T extends EditorElement>({
  element,
  renderElement,
}: RendererProps<T>) {
  const children = element.children.map(child => {
    if (isEditorText(child)) {
      return child.text.length === 0 ? <br key={child.id} /> : child.text;
    }
    return (
      <Renderer element={child} renderElement={renderElement} key={child.id} />
    );
  });

  if (renderElement) return <>{renderElement(element, children, () => {})}</>;

  // To bypass React void elements invariant violation.
  if (children.length === 0) {
    // @ts-ignore https://github.com/DefinitelyTyped/DefinitelyTyped/issues/21651
    return createElement(element.tag, element.props);
  }
  // @ts-ignore https://github.com/DefinitelyTyped/DefinitelyTyped/issues/21651
  return createElement(element.tag, element.props, children);
}
