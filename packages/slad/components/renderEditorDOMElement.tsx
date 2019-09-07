import { createElement, Children } from 'react';
import { EditorDOMElement, RenderEditorElement } from '../models/element';

export const renderEditorDOMElement: RenderEditorElement<EditorDOMElement> = (
  element,
  children,
  ref,
) => {
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
