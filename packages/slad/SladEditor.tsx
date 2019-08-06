import React, { ReactNode, CSSProperties, useMemo } from 'react';
import {
  SladEditorElement,
  SladElementDefaultProps,
  SladElement,
  RenderElement,
} from './SladEditorElement';
import { SladText } from './SladEditorText';

export type SladValue<Props = SladElementDefaultProps> = Readonly<{
  element: SladElement<Props>;
}>;

export type RenderText = (text: SladText) => ReactNode;

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

// React.memo does not support generic type so we use useMemo instead.
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087
export function SladEditor<Props = SladElementDefaultProps>({
  value,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange,
  disabled,
  renderElement,
  ...rest
}: SladEditorProps<Props>): JSX.Element {
  return useMemo(() => {
    return (
      <div
        contentEditable={!disabled}
        suppressContentEditableWarning={!disabled}
        {...rest}
      >
        <SladEditorElement<Props>
          element={value.element}
          renderElement={renderElement}
        />
      </div>
    );
  }, [disabled, renderElement, rest, value.element]);
}
