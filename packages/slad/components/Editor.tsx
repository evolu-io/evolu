/* eslint-env browser */
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
import { RenderEditorElementContext } from '../contexts/RenderEditorElementContext';
import {
  EditorSelection,
  mapSelectionToEditorSelection,
  editorSelectionsAreEqual,
  editorSelectionIsBackward,
} from '../models/selection';
import { renderEditorReactDOMElement } from './renderEditorReactDOMElement';
import {
  EditorElement,
  EditorReactDOMElement,
  RenderEditorElement,
} from '../models/element';
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
  editorState: EditorState<EditorElement>,
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
      const nodesLength = countNodes(editorState.element);
      invariant(
        nodesLength === nodesEditorPathsMap.size,
        'It looks like the ref in the custom renderElement of Editor is not used.',
      );
    }, [nodesEditorPathsMap, editorState.element]);
  }
}

function useEditorStateHasFocusOnDiv(
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
  | { type: 'select'; editorSelection: EditorSelection | undefined }
  | { type: 'setText'; path: EditorPath; text: string }
  // | { type: 'setValueElement'; element: Element }
>;

function useEditorCommand<T>(
  editorState: EditorState<T>,
  onChange: (editorState: EditorState<T>) => void,
) {
  const editorStateRef = useRef(editorState);
  editorStateRef.current = editorState;

  // To have stable command like useReducer dispatch is.
  const commandRef = useRef((immutableCommand: EditorCommand) => {
    if (process.env.NODE_ENV !== 'production') {
      debug('command', immutableCommand);
    }
    const command = immutableCommand as Draft<EditorCommand>;
    const nextEditorState = produce(editorStateRef.current, draft => {
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
          // Immer checks only props. Deep checks must be explicit.
          if (
            editorSelectionsAreEqual(command.editorSelection, draft.selection)
          ) {
            return;
          }
          // This is the correct pattern for optional truthy props.
          if (command.editorSelection) {
            draft.selection = command.editorSelection;
          } else {
            delete draft.selection;
          }
          break;
        }
        case 'setText': {
          // const { path, text } = command;
          break;
        }
        default:
          assertNever(command);
      }
    });
    if (nextEditorState === editorStateRef.current) return;
    onChange(nextEditorState);
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

export interface EditorState<T extends EditorElement = EditorReactDOMElement> {
  readonly element: Immutable<T>;
  readonly selection?: EditorSelection;
  readonly hasFocus?: boolean;
  readonly blurWithinWindow?: boolean;
}

export interface EditorProps<T extends EditorElement = EditorElement>
  extends UsefulReactDivAtttributes {
  editorState: EditorState<T>;
  onChange: (editorState: EditorState<T>) => void;
  renderElement?: RenderEditorElement<T>;
}

export function Editor<T extends EditorElement>({
  editorState,
  onChange,
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

  useDebugNodesEditorPaths(nodesEditorPathsMap, editorState);
  useInvariantEditorElementIsNormalized(editorState.element);

  useEditorStateHasFocusOnDiv(
    editorState.hasFocus,
    divRef,
    editorState.blurWithinWindow,
  );

  const command = useEditorCommand<T>(editorState, onChange);

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
      command({ type: 'select', editorSelection });
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
    if (editorSelectionsAreEqual(editorState.selection, currentEditorSelection))
      return;
    if (!editorState.selection) {
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

    const isBackward = editorSelectionIsBackward(editorState.selection);

    const [startNode, startOffset] = editorPathToNodeOffset(
      isBackward ? editorState.selection.focus : editorState.selection.anchor,
    );
    const [endNode, endOffset] = editorPathToNodeOffset(
      isBackward ? editorState.selection.anchor : editorState.selection.focus,
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
  }, [
    editorPathsNodesMap,
    findEditorSelection,
    getSelection,
    editorState.selection,
  ]);

  useEffect(() => {
    if (pendingNewSelectionChange.current || !editorState.hasFocus) return;
    ensureSelectionMatchesEditorSelection();
  }, [ensureSelectionMatchesEditorSelection, editorState.hasFocus]);

  // layout effect?
  useEffect(() => {
    if (divRef.current == null) return;
    const observer = new MutationObserver(mutationRecords => {
      mutationRecords.forEach(mutationRecord => {
        // We have to handle childList as explained in Draft
        // if (mutationRecord.type === 'childList') {
        //   console.log(mutationRecord.addedNodes, mutationRecord.removedNodes);
        // }
        if (mutationRecord.type === 'characterData') {
          const path = nodesEditorPathsMap.get(mutationRecord.target);
          // Watch when it happens, maybe force rerender as Draft does that.
          if (path == null) {
            if (process.env.NODE_ENV !== 'production') {
              invariant(
                false,
                'MutationObserver characterData target is not in nodesEditorPathsMap.',
              );
            }
          }
          // setText, imho
          // odzkouset
          // pak sjednotit se selekci
          // command({ type: 'focus' });

          // fakticky by to ale nemelo hnout s domem, imho ten spellCheck to odhali
          // a ten command imho musi mit i novou selekci, pac atomic operation
          // const newText = mutationRecord.target.nodeValue;
          // detekce zmeny, immer na zmenu elementu pres path, update selekce, v jednom.
          // console.log(newText);
        }
      });
    });
    observer.observe(divRef.current, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
    };
  }, [command, nodesEditorPathsMap]);

  const children = useMemo(() => {
    return (
      <SetNodeEditorPathContext.Provider value={setNodeEditorPath}>
        <RenderEditorElementContext.Provider
          value={
            (renderElement ||
              renderEditorReactDOMElement) as RenderEditorElement<EditorElement>
          }
        >
          <EditorElementRenderer element={editorState.element} path={[]} />
        </RenderEditorElementContext.Provider>
      </SetNodeEditorPathContext.Provider>
    );
  }, [renderElement, setNodeEditorPath, editorState.element]);

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
        contentEditable
        data-gramm // Disable Grammarly Chrome extension.
        onBlur={handleDivBlur}
        onFocus={handleDivFocus}
        ref={divRef}
        role={role}
        spellCheck={spellCheck}
        suppressContentEditableWarning
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        {...rest}
      >
        {children}
      </div>
    );
  }, [
    autoCorrect,
    children,
    handleDivBlur,
    handleDivFocus,
    rest,
    role,
    spellCheck,
  ]);
}
