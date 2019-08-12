import React, {
  CSSProperties,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import invariant from 'tiny-invariant';
import Debug from 'debug';
import produce, { Immutable, Draft } from 'immer';
import { assertNever } from 'assert-never';
import {
  SetNodePath,
  SetNodePathContext,
  Node,
} from '../contexts/SetNodePathContext';
import { EditorElement } from './EditorElement';
import {
  RenderElementContext,
  RenderElement,
} from '../contexts/RenderElementContext';
import {
  // To avoid clash with browser Selection.
  Selection as ModelSelection,
  selectionIsCollapsed,
} from '../models/selection';
import { renderDivElement } from './renderDivElement';
import { Element } from '../models/element';
import { Value } from '../models/value';
import { useDocumentSelectionChange } from '../hooks/useDocumentSelectionChange';
import { Path } from '../models/path';

type NodesPathsMap = Map<Node, Path>;

const useNodesPathsMap = (): NodesPathsMap => {
  // https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
  const nodesPathsMapRef = useRef<NodesPathsMap | null>(null);
  if (nodesPathsMapRef.current == null) nodesPathsMapRef.current = new Map();
  return nodesPathsMapRef.current;
};

const debug = Debug('editor');

const useDevDebug = (nodesPathsMap: NodesPathsMap, value: Value<Element>) => {
  useEffect(() => {
    // https://overreacted.io/how-does-the-development-mode-work/
    if (process.env.NODE_ENV !== 'production') {
      const nodes: [string, Node][] = [];
      nodesPathsMap.forEach((path, node) => {
        nodes.push([path.join(), node]);
      });
      debug('nodesPathsMap after render', nodes);

      const countNodes = (node: Element | string, count = 0) => {
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
        'It looks like you forgot to use ref in custom renderElement of Editor.',
      );
    }
  }, [nodesPathsMap, value.element]);
};

type CommandAction = Draft<
  | { type: 'setSelection'; selection: ModelSelection | undefined }
  | { type: 'insertText'; path: Path; text: string }
>;

export interface EditorProps<T extends Element> {
  value: Value<T>;
  onChange: (value: Value<T>) => void;
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
export function Editor<T extends Element>({
  value,
  onChange,
  disabled,
  renderElement,
  ...rest
}: EditorProps<T>) {
  const handleCommand = useCallback(
    (draft: Draft<Value<T>>, action: CommandAction) => {
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

  const mapSelectionToModelSelection = useCallback(
    (selection: Selection | undefined): ModelSelection | undefined => {
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
      const modelSelection = mapSelectionToModelSelection(selection);
      command({ type: 'setSelection', selection: modelSelection });
    },
    [command, mapSelectionToModelSelection],
  );

  const divRef = useRef<HTMLDivElement>(null);
  useDocumentSelectionChange(divRef, handleDocumentSelectionChange);

  const setNodePath = useCallback<SetNodePath>(
    (node, path) => {
      if (path != null) {
        nodesPathsMap.set(node, path);
      } else {
        nodesPathsMap.delete(node);
      }
    },
    [nodesPathsMap],
  );

  // Cast renderElement, because React context value can't be generic.
  const renderEditorElement =
    (renderElement as RenderElement<Element> | undefined) || renderDivElement;

  // Granular "shouldComponentUpdate" ftw.
  const children = useMemo(() => {
    return (
      <SetNodePathContext.Provider value={setNodePath}>
        <RenderElementContext.Provider value={renderEditorElement}>
          <EditorElement element={value.element} path={[]} />
        </RenderElementContext.Provider>
      </SetNodePathContext.Provider>
    );
  }, [renderEditorElement, setNodePath, value.element]);

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
