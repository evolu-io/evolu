import React, { memo, useCallback, ReactNode, Fragment } from 'react';
import { useReferenceKey } from './useReferenceKey';

// SladElement is rendered as HTMLDivElement by default.
type SladElementDefaultProps = React.HTMLAttributes<HTMLDivElement>;

export type SladText = Readonly<{
  type: 'text';
  value: string;
}>;

export type SladElement<Props = SladElementDefaultProps> = Readonly<{
  props: Props;
  children: readonly (SladElement<Props> | SladText)[];
}>;

const isSladText = (x: SladElement | SladText): x is SladText => {
  return 'type' in x && x.type === 'text';
};

export type SladValue = Readonly<{
  element: SladElement;
  // TODO: Add SladSelection.
}>;

export type RenderText = (text: SladText) => ReactNode;

export type RenderElement = (
  props: SladElementDefaultProps,
  children: ReactNode,
) => ReactNode;

export interface SladEditorProps {
  value: SladValue;
  onChange: (value: SladValue) => void;
}

export const SladEditor = memo<SladEditorProps>(function SladEditor({
  value,
  // onChange,
}) {
  // const handleInputChange = useCallback(() => {
  //   onChange(value);
  // }, [onChange, value]);

  const renderText = useCallback<RenderText>(text => {
    return text.value;
  }, []);

  const renderElement = useCallback<RenderElement>((props, children) => {
    return <div {...props}>{children}</div>;
  }, []);

  const getReferenceKey = useReferenceKey();

  const renderTree = useCallback(
    (element: SladElement): ReactNode => {
      const children: ReactNode = element.children.map(child => {
        const key = getReferenceKey(child);
        return (
          <Fragment key={key}>
            {isSladText(child) ? renderText(child) : renderTree(child)}
          </Fragment>
        );
      });
      return renderElement(element.props, children);
    },
    [getReferenceKey, renderElement, renderText],
  );

  // Of course it will be contentEditable. This is just an example for now.
  return <div>{renderTree(value.element)}</div>;
});
