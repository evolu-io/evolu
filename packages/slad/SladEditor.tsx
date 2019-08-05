import React, {
  memo,
  useCallback,
  ReactNode,
  Fragment,
  CSSProperties,
} from 'react';
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
  disabled?: boolean;
  // Some React HTMLAttributes.
  autoCapitalize?: string;
  autoCorrect?: 'on' | 'off';
  className?: string;
  role?: string;
  spellCheck?: boolean;
  style?: CSSProperties;
  tabIndex?: number;
}

export const SladEditor = memo<SladEditorProps>(function SladEditor({
  value,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange,
  disabled,
  ...rest
}) {
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

  return (
    <div
      contentEditable={!disabled}
      suppressContentEditableWarning={!disabled}
      {...rest}
    >
      {renderTree(value.element)}
    </div>
  );
});
