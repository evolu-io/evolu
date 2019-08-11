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
import produce, { Immutable, Draft } from 'immer';
import { assertNever } from 'assert-never';
import {
  SladPath,
  SladEditorSetNodePath,
  SladEditorSetNodePathContext,
  Node,
} from './SladEditorSetNodePathContext';
import { SladEditorElement } from './SladEditorElement';
import {
  SladEditorRenderElementContext,
  RenderElement,
} from './SladEditorRenderElementContext';
import { SladSelection, selectionIsCollapsed } from '../models/selection';
import { renderDivElement } from './rendeDivElement';
import { SladElement } from '../models/element';
import { SladValue } from '../models/value';

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
        'It looks like you forgot to use ref in custom renderElement of SladEditor.',
      );
    }
  }, [nodesPathsMap, value.element]);
};

const useDocumentSelectionChange = (
  ref: RefObject<Element>,
  callback: (selection: Selection | undefined) => void,
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
      callback(
        (doc.defaultView && doc.defaultView.getSelection()) || undefined,
      );
    };
    // Hmm, should we use useSubscription for future concurrent mode?
    // https://github.com/facebook/react/issues/16350
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [callback, ref]);
};

type CommandAction = Draft<
  | { type: 'setSelection'; selection: SladSelection | undefined }
  | { type: 'insertText'; path: SladPath; text: string }
>;

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
  const handleCommand = useCallback(
    (draft: Draft<SladValue<T>>, action: CommandAction) => {
      switch (action.type) {
        case 'setSelection': {
          draft.selection = action.selection;
          break;
        }
        case 'insertText': {
          break;
        }
        default:
          return assertNever(action);
      }
    },
    [],
  );

  // Note casting from immutable to mutable. TypeScript is right with enforcing it.
  const command = useCallback(
    (action: Immutable<CommandAction>) => {
      onChange(
        produce(value, draft => {
          handleCommand(draft, action as Draft<CommandAction>);
        }),
      );
    },
    [handleCommand, onChange, value],
  );

  const nodesPathsMap = useNodesPathsMap();
  useDevDebug(nodesPathsMap, value);

  const mapSelectionToSladSelection = useCallback(
    (selection: Selection | undefined): SladSelection | undefined => {
      if (!selection) return undefined;
      const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
      if (!anchorNode || !focusNode) return undefined;
      const anchorPath = nodesPathsMap.get(anchorNode as Node);
      const focusPath = nodesPathsMap.get(focusNode as Node);
      if (!anchorPath || !focusPath) return undefined;
      return {
        anchor: [...anchorPath, anchorOffset],
        focus: [...focusPath, focusOffset],
      };
    },
    [nodesPathsMap],
  );

  const handleDocumentSelectionChange = useCallback(
    (selection: Selection | undefined) => {
      const sladSelection = mapSelectionToSladSelection(selection);
      command({ type: 'setSelection', selection: sladSelection });
    },
    [command, mapSelectionToSladSelection],
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

  // just a quick test!
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (value.selection == null) return;
      if (!selectionIsCollapsed(value.selection)) return;
      command({
        type: 'insertText',
        path: value.selection.focus,
        text: event.key,
      });
    },
    [command, value.selection],
  );

  return useMemo(() => {
    return (
      <div
        contentEditable={!disabled}
        ref={divRef}
        role="textbox"
        suppressContentEditableWarning={!disabled}
        tabIndex={disabled ? -1 : 0}
        // TODO: Remove this test!
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {children}
      </div>
    );
  }, [children, disabled, handleKeyDown, rest]);
}
