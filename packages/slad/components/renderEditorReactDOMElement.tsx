import { createElement, Children } from 'react';
import { EditorReactDOMElement, RenderEditorElement } from '../models/element';

export const renderEditorReactDOMElement: RenderEditorElement<
  EditorReactDOMElement
> = (element, children, ref) => {
  // To bypass React void elements invariant violation.
  if (Children.count(children) === 0) {
    return createElement(element.tag || 'div', { ...element.props, ref });
  }
  return createElement(
    element.tag || 'div',
    { ...element.props, ref },
    children,
  );
};
