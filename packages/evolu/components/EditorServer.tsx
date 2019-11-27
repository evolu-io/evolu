import { constVoid } from 'fp-ts/lib/function';
import React, { Fragment, memo } from 'react';
import { normalizeElement, renderReactElement } from '../models/element';
import { textIsBR } from '../models/text';
import { Element, RenderElement } from '../types';

interface ServerElementRendererProps {
  element: Element;
  renderElement?: RenderElement;
}

export const ServerElementRenderer = ({
  element,
  renderElement,
}: ServerElementRendererProps) => {
  const children = element.children.map((child, index) => {
    if (Element.is(child))
      return (
        <ServerElementRenderer
          element={child}
          renderElement={renderElement}
          key={child.id}
        />
      );
    const key = index.toString();
    return textIsBR(child) ? (
      <br key={key} />
    ) : (
      <Fragment key={key}>{child}</Fragment>
    );
  });
  const renderFunction = renderElement || renderReactElement;
  return <>{renderFunction(element, children, constVoid)}</>;
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
