import React, { CSSProperties, useMemo, useCallback, useEffect } from 'react';
import invariant from 'tiny-invariant';
import Debug from 'debug';
import {
  SladEditorElement,
  SladElementDefaultProps,
  SladElement,
  RenderElement,
  isSladText,
} from './SladEditorElement';
import {
  SladEditorSetNodePathContext,
  SladPath,
  SladEditorSetNodePath,
} from './SladEditorSetNodePathContext';
import { SladText } from './SladEditorText';

const debug = Debug('slad:editor');

export type SladValue<Props = SladElementDefaultProps> = Readonly<{
  element: SladElement<Props>;
}>;

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

// React.memo does not support generic type, but that's fine because we prefer
// useMemo which provides better granularity.
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087
export function SladEditor<Props = SladElementDefaultProps>({
  value,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange,
  disabled,
  renderElement,
  ...rest
}: SladEditorProps<Props>): JSX.Element {
  // We use nodesPathsMap to map browser API to Slad API.
  const nodesPathsMap = useMemo(() => new Map<Element | Text, SladPath>(), []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const nodes: [string, Element | Text][] = [];
      nodesPathsMap.forEach((path, node) => {
        nodes.push([path.join(), node]);
      });
      debug('nodesPathsMap after render', nodes);

      const countNodes = (node: SladElement | SladText, count = 0) => {
        if (isSladText(node)) return count + 1;
        let childrenCount = 0;
        node.children.forEach(child => {
          childrenCount += countNodes(child, count);
        });
        return count + 1 + childrenCount;
      };
      const nodesLength = countNodes(value.element);
      invariant(
        nodesLength === nodesPathsMap.size,
        'It looks like you forget to use ref in custom renderElement',
      );
    }
  });

  const setNodePath = useCallback<SladEditorSetNodePath>(
    (node, path) => {
      if (path != null) {
        nodesPathsMap.set(node, path);
      } else {
        nodesPathsMap.delete(node);
      }
    },
    [nodesPathsMap],
  );

  const children = useMemo(() => {
    return (
      <SladEditorSetNodePathContext.Provider value={setNodePath}>
        <SladEditorElement<Props>
          element={value.element}
          renderElement={renderElement}
          path={[]}
        />
      </SladEditorSetNodePathContext.Provider>
    );
  }, [renderElement, setNodePath, value.element]);

  return useMemo(() => {
    return (
      <div
        contentEditable={!disabled}
        suppressContentEditableWarning={!disabled}
        {...rest}
      >
        {children}
      </div>
    );
  }, [children, disabled, rest]);
}
