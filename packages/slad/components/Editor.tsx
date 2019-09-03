/* eslint-env browser */
import React, {
  useRef,
  useCallback,
  useMemo,
  useEffect,
  RefObject,
  useLayoutEffect,
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
  invariantEditorSelectionIsDefined,
  invariantEditorSelectionIsCollapsed,
} from '../models/selection';
import { renderEditorReactDOMElement } from './renderEditorReactDOMElement';
import {
  EditorReactDOMElement,
  RenderEditorElement,
  EditorElement,
  getParentElementByPath,
  invariantElementChildrenIsDefined,
  invariantElementChildIsString,
} from '../models/element';
import { usePrevious } from '../hooks/usePrevious';
import { useInvariantEditorElementIsNormalized } from '../hooks/useInvariantEditorElementIsNormalized';
import {
  EditorPath,
  NodesEditorPathsMap,
  EditorPathsNodesMap,
} from '../models/path';

const isSSR = typeof window === 'undefined';

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
  | { type: 'writeTextToCollapsedSelection'; path: EditorPath; text: string }
  // | { type: 'setValueElement'; element: Element }
>;

function useEditorCommand<T extends EditorElement>(
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
          if (command.blurWithinWindow) {
            draft.blurWithinWindow = command.blurWithinWindow;
          } else {
            delete draft.blurWithinWindow;
          }
          break;
        }

        case 'select': {
          const { editorSelection } = command;
          if (editorSelectionsAreEqual(editorSelection, draft.selection))
            return;
          if (editorSelection) {
            draft.selection = editorSelection;
          } else {
            delete draft.selection;
          }
          break;
        }

        case 'writeTextToCollapsedSelection': {
          if (!invariantEditorSelectionIsDefined(draft.selection)) return;
          invariantEditorSelectionIsCollapsed(draft.selection);
          const { path, text } = command;
          const { children } = getParentElementByPath(
            draft.element,
            path,
          ) as Draft<EditorElement>;
          if (!invariantElementChildrenIsDefined(children)) return;
          const childIndex = path.slice(-1)[0];
          const child = children[childIndex];
          if (!invariantElementChildIsString(child)) return;
          const offset = text.length - child.length;
          children[childIndex] = text;
          draft.selection.anchor[draft.selection.anchor.length - 1] += offset;
          draft.selection.focus[draft.selection.focus.length - 1] += offset;
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

  // Map document selection to editor selection.
  useEffect(() => {
    const doc = divRef.current && divRef.current.ownerDocument;
    if (doc == null) return;
    const handleDocumentSelectionChange = () => {
      const selection = getSelection();
      const editorSelection = mapSelectionToEditorSelection(
        selection,
        nodesEditorPathsMap,
      );
      // Editor must remember the last selection when document selection
      // is moved elsewhere to restore it later on focus.
      // In Chrome, contentEditable does not do that.
      // That's why we ignore null values.
      if (editorSelection == null) return;
      command({ type: 'select', editorSelection });
    };
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [command, getSelection, nodesEditorPathsMap]);

  // const setBrowserSelection = useCallback((editorSelection: Editor) => {
  //   //
  // }, []);

  const ensureSelectionMatchesEditorSelection = useCallback(() => {
    const selection = getSelection();
    if (selection == null) return;
    const currentSelection = mapSelectionToEditorSelection(
      selection,
      nodesEditorPathsMap,
    );
    if (editorSelectionsAreEqual(editorState.selection, currentSelection))
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

    // console.log('update selection manually');

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
    getSelection,
    nodesEditorPathsMap,
    editorState.selection,
    editorPathsNodesMap,
  ]);

  // useLayoutEffect is must to keep browser selection in sync with editor state.
  // I suppose this is the case for "progressively enhancing hooks"
  // https://github.com/facebook/react/issues/14927
  (isSSR ? useEffect : useLayoutEffect)(() => {
    if (!editorState.hasFocus) return;
    ensureSelectionMatchesEditorSelection();
  }, [ensureSelectionMatchesEditorSelection, editorState.hasFocus]);

  useEffect(() => {
    if (divRef.current == null) return;
    // The idea is to let browser do its things for writting text.
    // It's neccessary for IME anyway, as described in DraftJS.
    // If neccessary, fix DOM manually.
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
            invariant(
              false,
              'MutationObserver characterData target is not in nodesEditorPathsMap.',
            );
            return;
          }

          command({
            type: 'writeTextToCollapsedSelection',
            path,
            text: mutationRecord.target.nodeValue || '',
          });
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
  }, [editorState.element, renderElement, setNodeEditorPath]);

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
