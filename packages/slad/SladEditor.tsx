import React, {
  useCallback,
  ReactNode,
  Fragment,
  CSSProperties,
  useMemo,
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

export type SladValue<Props = SladElementDefaultProps> = Readonly<{
  element: SladElement<Props>;
  // TODO: Add SladSelection.
}>;

export type RenderText = (text: SladText) => ReactNode;

export type RenderElement<Props = SladElementDefaultProps> = (
  props: Props,
  children: ReactNode,
) => ReactNode;

export interface SladEditorProps<Props = SladElementDefaultProps> {
  value: SladValue<Props>;
  onChange: (value: SladValue<Props>) => void;
  disabled?: boolean;
  renderElement?: RenderElement<Props>;
  // Some React HTMLAttributes.
  autoCapitalize?: string;
  autoCorrect?: 'on' | 'off';
  className?: string;
  role?: string;
  spellCheck?: boolean;
  style?: CSSProperties;
  tabIndex?: number;
}

export function SladEditor<Props = SladElementDefaultProps>({
  value,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange,
  disabled,
  renderElement,
  ...rest
}: SladEditorProps<Props>) {
  const renderText = useCallback<RenderText>(text => {
    return text.value;
  }, []);

  const renderDefaultElement = useCallback<RenderElement<Props>>(
    (props, children) => {
      return <div {...props}>{children}</div>;
    },
    [],
  );

  const getReferenceKey = useReferenceKey();

  const renderTree = useCallback(
    (element: SladElement<Props>): ReactNode => {
      const children: ReactNode = element.children.map(child => {
        const key = getReferenceKey(child);
        return (
          <Fragment key={key}>
            {isSladText(child) ? renderText(child) : renderTree(child)}
          </Fragment>
        );
      });
      return (renderElement || renderDefaultElement)(element.props, children);
    },
    [getReferenceKey, renderDefaultElement, renderElement, renderText],
  );

  // I don't know how to type React.memo with generic component, maybe it's not
  // even possible. Nevermind, we can memo div element instead.
  return useMemo(() => {
    return (
      <div
        contentEditable={!disabled}
        suppressContentEditableWarning={!disabled}
        {...rest}
      >
        {renderTree(value.element)}
      </div>
    );
  }, [disabled, renderTree, rest, value.element]);
}
