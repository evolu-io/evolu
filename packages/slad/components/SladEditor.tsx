import React, {
  CSSProperties,
  useRef,
  useEffect,
  RefObject,
  useCallback,
  useMemo,
} from 'react';
import invariant from 'tiny-invariant';
import Debug from 'debug';
import produce, { Immutable } from 'immer';
import {
  SladPath,
  SladEditorSetNodePath,
  SladEditorSetNodePathContext,
} from './SladEditorSetNodePathContext';
import { SladEditorElement } from './SladEditorElement';
import {
  SladEditorRenderElementContext,
  SladElement,
  RenderElement,
} from './SladEditorRenderElementContext';
import { SladSelection } from '../models/selection';

export interface SladDivElement extends SladElement {
  props: React.HTMLAttributes<HTMLDivElement>;
  children?: (SladDivElement | string)[] | undefined;
}

/**
 * SladValue is immutable value describing editor state.
 */
export interface SladValue<T extends SladElement = SladDivElement> {
  readonly element: Immutable<T>;
  readonly selection?: SladSelection | undefined;
}

// It should be possible to enforce this via types only, but TypeScript errors
// can be confusing, so it's good to have nice dev warning.
const isGoodEnoughSladDivElement = (
  element: SladElement,
): element is SladDivElement => {
  // https://overreacted.io/how-does-the-development-mode-work/
  if (process.env.NODE_ENV !== 'production') {
    const div = element as SladDivElement;
    return (
      typeof div.props === 'object' &&
      (div.props.style || div.props.className) != null
    );
  }
  return true;
};

const renderDivElement: RenderElement<SladDivElement> = (
  element,
  children,
  ref,
) => {
  if (!isGoodEnoughSladDivElement(element)) {
    // https://overreacted.io/how-does-the-development-mode-work/
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        false,
        'SladEditor: SladDivElement props has to have at least className or style prop. Or pass custom renderElement to SladEditor.',
      );
    }
    return null;
  }
  return (
    <div {...element.props} ref={ref}>
      {children}
    </div>
  );
};

type NodesPathsMap = Map<Node, SladPath>;

const useNodesPathsMap = (): NodesPathsMap => {
  // https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
  const nodesPathsMapRef = useRef<NodesPathsMap | null>(null);
  if (nodesPathsMapRef.current == null) nodesPathsMapRef.current = new Map();
  return nodesPathsMapRef.current;
};

const debug = Debug('slad:editor');

const useDevDebug = (
  nodesPathsMap: NodesPathsMap,
  value: SladValue<SladElement>,
) => {
  useEffect(() => {
    // https://overreacted.io/how-does-the-development-mode-work/
    if (process.env.NODE_ENV !== 'production') {
      const nodes: [string, Node][] = [];
      nodesPathsMap.forEach((path, node) => {
        nodes.push([path.join(), node]);
      });
      debug('nodesPathsMap after render', nodes);

      const countNodes = (node: SladElement | string, count = 0) => {
        if (typeof node === 'string') return count + 1;
        let childrenCount = 0;
        if (node.children)
          node.children.forEach(child => {
            childrenCount += countNodes(child, count);
          });
        return count + 1 + childrenCount;
      };
      const nodesLength = countNodes(value.element);
      invariant(
        nodesLength === nodesPathsMap.size,
        'SladEditor: It looks like you forgot to use ref in custom renderElement',
      );
    }
  }, [nodesPathsMap, value.element]);
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
    // Hmm, should we use useSubscription for future concurrent mode?
    // https://github.com/facebook/react/issues/16350
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [callback, ref]);
};

export interface SladEditorProps<T extends SladElement> {
  value: SladValue<T>;
  onChange: (value: SladValue<T>) => void;
  disabled?: boolean;
  renderElement?: RenderElement<T>;
  // Some React HTMLAttributes.
  autoCapitalize?: string;
  autoCorrect?: 'on' | 'off';
  className?: string;
  role?: string;
  spellCheck?: boolean;
  style?: CSSProperties;
  tabIndex?: number;
}

// No memo for two reasons:
//  1) It's not possible to memoize generic component.
//  2) We prefer better memoize granularity via inner useMemo anyway.
export function SladEditor<T extends SladElement>({
  value,
  onChange,
  disabled,
  renderElement,
  ...rest
}: SladEditorProps<T>) {
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
          delete draft.selection;
          // eslint-disable-next-line no-useless-return
          return;
        }
        // Temp fix. We don't want to update model directly, so TypeScipt is right.
        draft.selection = {
          anchor: sladSelection.anchor.slice(),
          focus: sladSelection.focus.slice(),
        };
      });
      onChange(nextValue);
    },
    [mapSelectionToSladSelection, onChange, value],
  );

  const divRef = useRef<HTMLDivElement>(null);
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

  // SladEditorRenderElementContext value requires SladElement.
  // React context value can't be generic, as far as I know, because it must be
  // defined before Editor is instantiated. I suppose, this is right workaround.
  const renderSladElement = ((renderElement ||
    renderDivElement) as unknown) as RenderElement<SladElement>;

  // Granular "shouldComponentUpdate" ftw.
  const children = useMemo(() => {
    return (
      <SladEditorSetNodePathContext.Provider value={setNodePath}>
        <SladEditorRenderElementContext.Provider value={renderSladElement}>
          <SladEditorElement element={value.element} path={[]} />
        </SladEditorRenderElementContext.Provider>
      </SladEditorSetNodePathContext.Provider>
    );
  }, [renderSladElement, setNodePath, value.element]);

  return useMemo(() => {
    return (
      <div
        contentEditable={!disabled}
        ref={divRef}
        role="textbox"
        suppressContentEditableWarning={!disabled}
        tabIndex={disabled ? -1 : 0}
        {...rest}
      >
        {children}
      </div>
    );
  }, [children, disabled, rest]);
}
