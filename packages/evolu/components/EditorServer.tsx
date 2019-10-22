import React, { createElement, Children, memo } from 'react';
import { constVoid } from 'fp-ts/lib/function';
import {
  RenderElement,
  Element,
  ReactElement,
  normalizeElement,
} from '../models/element';
import { isText } from '../models/text';
import { mapNodeIDToString } from '../models/node';

export const renderReactElement: RenderElement = (element, children, ref) => {
  const { tag, props } = element as ReactElement;
  // To bypass React void elements invariant violation.
  // We don't want to pass children are many args because they already have keys.
  if (Children.count(children) === 0) {
    return createElement(tag, { ...props, ref });
  }
  return createElement(tag, { ...props, ref }, children);
};

export interface ServerElementRendererProps {
  element: Element;
  renderElement?: RenderElement;
}

export const ServerElementRenderer = ({
  element,
  renderElement,
}: ServerElementRendererProps) => {
  const children = element.children.map(child => {
    if (isText(child)) {
      return child.text.length === 0 ? (
        <br key={mapNodeIDToString(child.id)} />
      ) : (
        child.text
      );
    }
    return (
      <ServerElementRenderer
        element={child}
        renderElement={renderElement}
        key={mapNodeIDToString(child.id)}
      />
    );
  });
  if (renderElement) {
    return <>{renderElement(element, children, constVoid)}</>;
  }
  return <>{renderReactElement(element, children, constVoid)}</>;
};

export type UsefulReactDivAtttributesServer = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  'className' | 'id' | 'style'
>;

/**
 * Just render. No edit. Good for performance and tree shaking.
 */
export const EditorServer = memo<
  ServerElementRendererProps & UsefulReactDivAtttributesServer
>(({ element, renderElement, ...rest }) => {
  const normalizedElement = normalizeElement(element);
  return (
    <div {...rest}>
      <ServerElementRenderer
        element={normalizedElement}
        renderElement={renderElement}
      />
    </div>
  );
});

EditorServer.displayName = 'EditorServer';
