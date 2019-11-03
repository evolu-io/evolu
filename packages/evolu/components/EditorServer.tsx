import { constVoid } from 'fp-ts/lib/function';
import React, { Children, createElement, memo } from 'react';
import { isElement, normalizeElement } from '../models/element';
import { nodeIDToString } from '../models/node';
import { textIsBR } from '../models/text';
import { Element, ReactElement, RenderElement } from '../types';

export const renderReactElement: RenderElement = (element, children, ref) => {
  const { tag, props } = element as ReactElement;
  // To bypass React void elements invariant violation.
  // We don't want to pass children are many args because they already have keys.
  if (Children.count(children) === 0) {
    return createElement(tag, { ...props, ref });
  }
  return createElement(tag, { ...props, ref }, children);
};

interface ServerElementRendererProps {
  element: Element;
  renderElement?: RenderElement;
}

export const ServerElementRenderer = ({
  element,
  renderElement,
}: ServerElementRendererProps) => {
  const children = element.children.map(child => {
    if (isElement(child))
      return (
        <ServerElementRenderer
          element={child}
          renderElement={renderElement}
          key={nodeIDToString(child.id)}
        />
      );
    return textIsBR(child) ? <br key={nodeIDToString(child.id)} /> : child.text;
  });
  if (renderElement) {
    return <>{renderElement(element, children, constVoid)}</>;
  }
  return <>{renderReactElement(element, children, constVoid)}</>;
};

type ReactDivAtttributesUsefulForEditorServer = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  'className' | 'id' | 'style'
>;

type EditorServerProps = ServerElementRendererProps &
  ReactDivAtttributesUsefulForEditorServer;

/**
 * Just render. No edit. Good for performance and tree shaking.
 */
export const EditorServer = memo<EditorServerProps>(
  ({ element, renderElement, ...rest }) => {
    const normalizedElement = normalizeElement(element);
    return (
      <div {...rest}>
        <ServerElementRenderer
          element={normalizedElement}
          renderElement={renderElement}
        />
      </div>
    );
  },
);

EditorServer.displayName = 'EditorServer';
