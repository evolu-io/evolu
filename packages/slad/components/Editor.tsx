import React, {
  useRef,
  useCallback,
  useMemo,
  useEffect,
  RefObject,
} from 'react';
import produce, { Draft, Immutable } from 'immer';
import { assertNever } from 'assert-never';
import Debug from 'debug';
import invariant from 'tiny-invariant';
import {
  SetNodeEditorPath,
  SetNodeEditorPathContext,
} from '../contexts/SetNodeEditorPathContext';
import { EditorElementRenderer } from './EditorElementRenderer';
import {
  RenderEditorElementContext,
  RenderEditorElement,
} from '../contexts/RenderEditorElementContext';
import {
  EditorSelection,
  mapSelectionToEditorSelection,
  editorSelectionsAreEqual,
  editorSelectionIsBackward,
} from '../models/selection';
import { renderEditorDivElement } from './renderEditorDivElement';
import { EditorElement } from '../models/element';
import { EditorValue } from '../models/value';
import { usePrevious } from '../hooks/usePrevious';
import { useInvariantEditorElementIsNormalized } from '../hooks/useInvariantEditorElementIsNormalized';
import {
  EditorPath,
  NodesEditorPathsMap,
  EditorPathsNodesMap,
} from '../models/path';

function useEditorPathNodeMaps(): {
  nodesEditorPathsMap: NodesEditorPathsMap;
  editorPathsNodesMap: EditorPathsNodesMap;
  setNodeEditorPath: SetNodeEditorPath;
} {
  const mapsRef = useRef<{
    nodesEditorPathsMap: NodesEditorPathsMap;
    editorPathsNodesMap: EditorPathsNodesMap;
  } | null>(null);
  // https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
  if (mapsRef.current == null)
    mapsRef.current = {
      nodesEditorPathsMap: new Map(),
      editorPathsNodesMap: new Map(),
    };
  const { nodesEditorPathsMap, editorPathsNodesMap } = mapsRef.current;

  const setNodeEditorPath = useCallback<SetNodeEditorPath>(
    (node, path) => {
      if (path != null) {
        nodesEditorPathsMap.set(node, path);
        editorPathsNodesMap.set(path.join(), node);
      } else {
        const path = nodesEditorPathsMap.get(node) as EditorPath;
        nodesEditorPathsMap.delete(node);
        editorPathsNodesMap.delete(path.join());
      }
    },
    [editorPathsNodesMap, nodesEditorPathsMap],
  );

  return { nodesEditorPathsMap, editorPathsNodesMap, setNodeEditorPath };
}

const debug = Debug('editor');

function useDebugNodesEditorPaths(
  nodesEditorPathsMap: NodesEditorPathsMap,
  value: EditorValue<EditorElement>,
) {
  // https://overreacted.io/how-does-the-development-mode-work/
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const nodes: [string, Node][] = [];
      nodesEditorPathsMap.forEach((path, node) => {
        nodes.push([path.join(), node]);
      });
      debug('nodesEditorPathsMap after render', nodes);

      const countNodes = (node: EditorElement | string, count = 0) => {
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
        nodesLength === nodesEditorPathsMap.size,
        'It looks like the ref in the custom renderElement of Editor is not used.',
      );
    }, [nodesEditorPathsMap, value.element]);
  }
}

function useValueHasFocusOnDiv(
  hasFocus: boolean,
  divRef: RefObject<HTMLDivElement>,
) {
  const hadFocus = usePrevious(hasFocus);
  useEffect(() => {
    const { current: div } = divRef;
    if (div == null) return;
    if (hadFocus == null) {
      if (hasFocus) div.focus();
      return;
    }
    if (hadFocus === false && hasFocus) {
      div.focus();
    } else if (hadFocus === true && !hasFocus) {
      // Blur is tricky. Sometimes, it prevents to gain focus back.
      // Repro: cmd-tab quickly several times, and editor will not get focus.
      // div.blur();
    }
  }, [divRef, hadFocus, hasFocus]);
}

type EditorCommand = Immutable<
  | { type: 'focus'; value: boolean }
  | { type: 'select'; value: EditorSelection | undefined }
  // | { type: 'setValueElement'; value: Element }
>;

function useEditorCommand<T>(
  value: EditorValue<T>,
  onChange: (value: EditorValue<T>) => void,
) {
  const valueRef = useRef(value);
  valueRef.current = value;
  // To have stable command like useReducer dispatch is.
  const commandRef = useRef((immutableCommand: EditorCommand) => {
    const command = immutableCommand as Draft<EditorCommand>;
    const nextValue = produce(valueRef.current, draft => {
      switch (command.type) {
        case 'focus': {
          draft.hasFocus = command.value;
          break;
        }
        case 'select': {
          // Immer doesn't do deep checking.
          if (editorSelectionsAreEqual(command.value, draft.selection)) return;
          draft.selection = command.value;
          break;
        }
        default:
          assertNever(command);
      }
    });
    if (nextValue === valueRef.current) return;
    onChange(nextValue);
  });
  return commandRef.current;
}

type UsefulReactDivAtttributes = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  | 'accessKey'
  | 'autoCorrect'
  | 'className'
  | 'id'
  | 'role'
  | 'spellCheck'
  | 'style'
  | 'tabIndex'
>;

export interface EditorProps<T extends EditorElement = EditorElement>
  extends UsefulReactDivAtttributes {
  value: EditorValue<T>;
  onChange: (value: EditorValue<T>) => void;
  disabled?: boolean;
  renderElement?: RenderEditorElement<T>;
}

export function Editor<T extends EditorElement>({
  value,
  onChange,
  disabled,
  renderElement,
  autoCorrect = 'off', // Disable browser autoCorrect.
  spellCheck = false, // Disable browser spellCheck.
  role = 'textbox',
  ...rest
}: EditorProps<T>) {
  const divRef = useRef<HTMLDivElement>(null);
  const {
    nodesEditorPathsMap,
    editorPathsNodesMap,
    setNodeEditorPath,
  } = useEditorPathNodeMaps();

  useDebugNodesEditorPaths(nodesEditorPathsMap, value);
  useInvariantEditorElementIsNormalized(value.element);

  useValueHasFocusOnDiv(value.hasFocus, divRef);

  const command = useEditorCommand<T>(value, onChange);

  const getSelection = useCallback((): Selection | undefined => {
    const doc = divRef.current && divRef.current.ownerDocument;
    if (doc == null) return;
    return doc.getSelection() || undefined;
  }, []);

  const findEditorSelection = useCallback(
    (selection: Selection | undefined): EditorSelection | undefined => {
      return mapSelectionToEditorSelection(selection, nodesEditorPathsMap);
    },
    [nodesEditorPathsMap],
  );

  // Map selection to editor selection.
  useEffect(() => {
    const doc = divRef.current && divRef.current.ownerDocument;
    if (doc == null) return;
    const handleDocumentSelectionChange = () => {
      const selection = getSelection();
      const editorSelection = findEditorSelection(selection);
      // Editor must remember the last selection when document selection
      // is moved elsewhere to restore it later on focus.
      // In Chrome, contentEditable does not do that.
      // That's why we ignore null values.
      if (editorSelection == null) return;
      command({ type: 'select', value: editorSelection });
    };
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [command, findEditorSelection, getSelection]);

  // Ensure editor selection is actual.
  useEffect(() => {
    if (value.selection == null) return;
    const selection = getSelection();
    if (selection == null) return;
    const editorSelection = findEditorSelection(selection);
    if (editorSelectionsAreEqual(value.selection, editorSelection)) return;

    const doc = divRef.current && divRef.current.ownerDocument;
    if (doc == null) return;

    function editorPathToNodeOffset(path: EditorPath): [Node, number] {
      const node = editorPathsNodesMap.get(path.join());
      // Element
      if (node) {
        const parent = node.parentNode as Node;
        return [parent, path[path.length - 1]];
      }
      // Text
      const textNodePath = path.slice(0, -1);
      const textNode = editorPathsNodesMap.get(textNodePath.join()) as Node;
      return [textNode, path[path.length - 1]];
    }

    const isForward = !editorSelectionIsBackward(value.selection);

    const [startNode, startOffset] = editorPathToNodeOffset(
      isForward ? value.selection.anchor : value.selection.focus,
    );
    const [endNode, endOffset] = editorPathToNodeOffset(
      isForward ? value.selection.focus : value.selection.anchor,
    );

    if (startNode == null || endNode == null) return;

    const range = doc.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [editorPathsNodesMap, findEditorSelection, getSelection, value.selection]);

  const children = useMemo(() => {
    return (
      <SetNodeEditorPathContext.Provider value={setNodeEditorPath}>
        <RenderEditorElementContext.Provider
          value={
            // Cast renderElement, because React context value can't be generic.
            // We know it's safe because only Element API is used.
            ((renderElement ||
              renderEditorDivElement) as unknown) as RenderEditorElement<
              EditorElement
            >
          }
        >
          <EditorElementRenderer element={value.element} path={[]} />
        </RenderEditorElementContext.Provider>
      </SetNodeEditorPathContext.Provider>
    );
  }, [renderElement, setNodeEditorPath, value.element]);

  const handleDivFocus = useCallback(() => {
    command({ type: 'focus', value: true });
  }, [command]);

  const handleDivBlur = useCallback(() => {
    command({ type: 'focus', value: false });
  }, [command]);

  return useMemo(() => {
    return (
      <div
        autoCorrect={autoCorrect}
        contentEditable={!disabled}
        data-gramm // Disable Grammarly Chrome extension.
        onBlur={handleDivBlur}
        onFocus={handleDivFocus}
        ref={divRef}
        role={role}
        spellCheck={spellCheck}
        suppressContentEditableWarning={!disabled}
        tabIndex={disabled ? -1 : 0}
        {...rest}
      >
        {children}
      </div>
    );
  }, [
    autoCorrect,
    children,
    disabled,
    handleDivBlur,
    handleDivFocus,
    rest,
    role,
    spellCheck,
  ]);
}
