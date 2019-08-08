import React, {
  CSSProperties,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  RefObject,
} from 'react';
import invariant from 'tiny-invariant';
import Debug from 'debug';
import produce from 'immer';
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

export type SladSelection = Readonly<{
  anchor: SladPath;
  focus: SladPath;
}>;

export interface SladValue<Props = SladElementDefaultProps> {
  readonly element: SladElement<Props>;
  readonly selection?: SladSelection | null;
}

type NodesPathsMap = Map<Node, SladPath>;

const useNodesPathsMap = (): NodesPathsMap => {
  // https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
  const nodesPathsMapRef = useRef<NodesPathsMap | null>(null);
  if (nodesPathsMapRef.current == null) nodesPathsMapRef.current = new Map();
  return nodesPathsMapRef.current;
};

const debug = Debug('slad:editor');

const useDevDebug = (nodesPathsMap: NodesPathsMap, value: SladValue) => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const nodes: [string, Node][] = [];
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
};

const useDocumentSelectionChange = (
  ref: RefObject<Element>,
  callback: (selection: Selection | null) => void,
) => {
  // useEffect is called on every SladValue change because of the callback.
  // That's ok. It's cheap and right. Do not try to optimize it via useRef,
  // because it would duplicate a state.
  // Note we can not naively use useLayoutEffect because of SSR.
  // https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85
  useEffect(() => {
    const doc = ref.current && ref.current.ownerDocument;
    if (doc == null) return;
    const handleDocumentSelectionChange = () => {
      callback(doc.defaultView && doc.defaultView.getSelection());
    };
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [callback, ref]);
};

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
  onChange,
  disabled,
  renderElement,
  ...rest
}: SladEditorProps<Props>): JSX.Element {
  const divRef = useRef<HTMLDivElement>(null);
  const nodesPathsMap = useNodesPathsMap();
  useDevDebug(nodesPathsMap, value);

  const mapSelectionToSladSelection = useCallback(
    (selection: Selection | null): SladSelection | null => {
      if (selection == null) return null;
      const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
      if (anchorNode == null || focusNode == null) return null;
      const anchorPath = nodesPathsMap.get(anchorNode);
      const focusPath = nodesPathsMap.get(focusNode);
      if (anchorPath == null || focusPath == null) return null;
      return {
        anchor: [...anchorPath, anchorOffset],
        focus: [...focusPath, focusOffset],
      };
    },
    [nodesPathsMap],
  );

  const handleDocumentSelectionChange = useCallback(
    (selection: Selection | null) => {
      const sladSelection = mapSelectionToSladSelection(selection);
      const nextValue = produce(value, draft => {
        if (!sladSelection) {
          draft.selection = null;
          return;
        }
        // For some reason, we can't assign reaonly array into mutable draft:
        // "The type 'readonly number[]' is 'readonly' and cannot be assigned to
        // the mutable type 'number[]'"
        // Fortunately, we can use slice which returns mutable array.
        // Not great, not terrible.
        draft.selection = {
          anchor: sladSelection.anchor.slice(),
          focus: sladSelection.focus.slice(),
        };
      });
      onChange(nextValue);
    },
    [mapSelectionToSladSelection, onChange, value],
  );

  useDocumentSelectionChange(divRef, handleDocumentSelectionChange);

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
        ref={divRef}
        {...rest}
      >
        {children}
      </div>
    );
  }, [children, disabled, rest]);
}
