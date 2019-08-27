import React, { createElement } from 'react';
import { RenderEditorElement, EditorReactDOMElement } from '../models/element';

export interface RendererProps<T> {
  element: T;
  renderElement?: RenderEditorElement<T>;
}

/**
 * Just render. No edit behaviour. Good for performance and tree shaking.
 */
export function Renderer<T extends EditorReactDOMElement>({
  element,
  renderElement,
}: RendererProps<T>) {
  const children =
    element.children &&
    element.children.map((child, index) => {
      if (typeof child === 'string') return child;
      return (
        <Renderer
          element={child}
          // @ts-ignore TODO: Fix it.
          renderElement={renderElement}
          // Index is ok for value type.
          // eslint-disable-next-line react/no-array-index-key
          key={index}
        />
      );
    });
  if (renderElement) return <>{renderElement(element, children, () => {})}</>;
  return createElement(element.tag || 'div', element.props, children);
}
