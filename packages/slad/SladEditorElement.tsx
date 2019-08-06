import React, { ReactNode, Fragment, useMemo } from 'react';
import { SladText, SladEditorText } from './SladEditorText';
import { useReferenceKey } from './useReferenceKey';

export type SladElementDefaultProps = React.HTMLAttributes<HTMLDivElement>;

export type SladElement<Props = SladElementDefaultProps> = Readonly<{
  props: Props;
  children: readonly (SladElement<Props> | SladText)[];
}>;

export type RenderElement<Props = SladElementDefaultProps> = (
  props: Props,
  children: ReactNode,
) => ReactNode;

export interface SladEditorElementProps<Props = SladElementDefaultProps> {
  element: SladElement<Props>;
  renderElement: RenderElement<Props> | undefined;
}

const isSladText = (x: SladElement | SladText): x is SladText => {
  return 'type' in x && x.type === 'text';
};

const renderDefaultElement: RenderElement = (props, children) => {
  return <div {...props}>{children}</div>;
};

export function SladEditorElement<Props = SladElementDefaultProps>({
  element,
  renderElement,
}: SladEditorElementProps<Props>): JSX.Element {
  const getReferenceKey = useReferenceKey();

  const children = useMemo(() => {
    return element.children.map(child => {
      const key = getReferenceKey(child);
      return (
        <Fragment key={key}>
          {isSladText(child) ? (
            <SladEditorText text={child} />
          ) : (
            <SladEditorElement element={child} renderElement={renderElement} />
          )}
        </Fragment>
      );
    });
  }, [element.children, getReferenceKey, renderElement]);

  return useMemo(() => {
    return (
      <>{(renderElement || renderDefaultElement)(element.props, children)}</>
    );
  }, [children, element.props, renderElement]);
}
