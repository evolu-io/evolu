import { createElement, Children } from 'react';
import { EditorDOMElement, RenderEditorElement } from '../models/element';

export const renderEditorDOMElement: RenderEditorElement = (
  element,
  children,
  ref,
) => {
  const { tag, props } = element as EditorDOMElement;
  // To bypass React void elements invariant violation.
  if (Children.count(children) === 0) {
    return createElement(tag, { ...props, ref });
  }
  return createElement(tag, { ...props, ref }, children);
};
