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

// Map declarative value to imperative method.
function useValueHasFocusOnDiv(
  hasFocus: boolean | undefined,
  divRef: RefObject<HTMLDivElement>,
  blurWithinWindow: boolean | undefined,
) {
  const hadFocus = usePrevious(hasFocus);
  useEffect(() => {
    const { current: div } = divRef;
    if (div == null) return;
    const divHasFocus =
      div === (div.ownerDocument && div.ownerDocument.activeElement);
    if (!hadFocus && hasFocus) {
      if (!divHasFocus) div.focus();
    } else if (hadFocus && !hasFocus) {
      // When blurring occurs within the window (as opposed to clicking to
      // another tab or window), we do not call blur, so when window is
      // focused back, the editor will not lose its focus.
      if (divHasFocus && !blurWithinWindow) div.blur();
    }
  }, [blurWithinWindow, divRef, hadFocus, hasFocus]);
}

type EditorCommand = Immutable<
  | { type: 'focus' }
  | { type: 'blur'; blurWithinWindow: boolean | undefined }
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
          draft.hasFocus = true;
          delete draft.blurWithinWindow;
          break;
        }
        case 'blur': {
          draft.hasFocus = false;
          // Remember, blurWithinWindow is optional, and setting it to undefined
          // is properly considered as change in Immer.
          if (command.blurWithinWindow) {
            draft.blurWithinWindow = command.blurWithinWindow;
          } else {
            delete draft.blurWithinWindow;
          }
          break;
        }
        case 'select': {
          // Immer doesn't do deep checking.
          if (editorSelectionsAreEqual(command.value, draft.selection)) return;
          // This is the correct pattern for optional truthy props.
          if (command.value) {
            draft.selection = command.value;
          } else {
            delete draft.selection;
          }
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
  autoCorrect = 'off',
  spellCheck = false,
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

  useValueHasFocusOnDiv(value.hasFocus, divRef, value.blurWithinWindow);

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

  const pendingNewSelectionChange = useRef(false);
  pendingNewSelectionChange.current = false;

  // Map document selection to editor selection.
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
      pendingNewSelectionChange.current = true;
      command({ type: 'select', value: editorSelection });
    };
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [command, findEditorSelection, getSelection]);

  const ensureSelectionMatchesEditorSelection = useCallback(() => {
    const selection = getSelection();
    if (selection == null) return;
    const currentEditorSelection = findEditorSelection(selection);
    if (editorSelectionsAreEqual(value.selection, currentEditorSelection))
      return;
    if (!value.selection) {
      // TODO: What to do when selection is falsy? Blur? Collapse?
      // 'selection.removeAllRanges()' breaks tests.
      // The same for 'if (divRef.current) divRef.current.blur()'.
      // Feel free to send PR.
      return;
    }

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

    const isBackward = editorSelectionIsBackward(value.selection);

    const [startNode, startOffset] = editorPathToNodeOffset(
      isBackward ? value.selection.focus : value.selection.anchor,
    );
    const [endNode, endOffset] = editorPathToNodeOffset(
      isBackward ? value.selection.anchor : value.selection.focus,
    );

    if (startNode == null || endNode == null) return;

    const range = doc.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    selection.removeAllRanges();
    if (isBackward) {
      // https://stackoverflow.com/a/4802994/233902
      const endRange = range.cloneRange();
      endRange.collapse(false);
      selection.addRange(endRange);
      selection.extend(range.startContainer, range.startOffset);
    } else {
      selection.addRange(range);
    }
  }, [editorPathsNodesMap, findEditorSelection, getSelection, value.selection]);

  useEffect(() => {
    if (pendingNewSelectionChange.current || !value.hasFocus) return;
    ensureSelectionMatchesEditorSelection();
  }, [ensureSelectionMatchesEditorSelection, value.hasFocus]);

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
    ensureSelectionMatchesEditorSelection();
    command({ type: 'focus' });
  }, [command, ensureSelectionMatchesEditorSelection]);

  const handleDivBlur = useCallback(() => {
    const blurWithinWindow =
      divRef.current &&
      divRef.current.ownerDocument &&
      divRef.current.ownerDocument.activeElement === divRef.current;
    command({ type: 'blur', blurWithinWindow: blurWithinWindow || undefined });
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
