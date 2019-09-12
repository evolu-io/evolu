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
import { Optional } from 'utility-types';
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
import { renderEditorDOMElement } from './renderEditorDOMElement';
import {
  EditorDOMElement,
  RenderEditorElement,
  EditorElement,
  getParentElementByPath,
  invariantIsEditorText,
  EditorElementChild,
  isEditorText,
} from '../models/element';
import { usePrevious } from '../hooks/usePrevious';
import { useInvariantEditorElementIsNormalized } from '../hooks/useInvariantEditorElementIsNormalized';
import {
  EditorPath,
  NodesEditorPathsMap,
  EditorPathsNodesMap,
} from '../models/path';
import { editorTextsAreEqual } from '../models/text';

const isSSR = typeof window === 'undefined';

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

      const countNodes = (node: EditorElementChild, count = 0) => {
        if (isEditorText(node)) return count + 1;
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
  hasFocus: boolean,
  divRef: RefObject<HTMLDivElement>,
  tabLostFocus: boolean,
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
      // Do not call blur when tab lost focus so editor can be focused back.
      // For visual test, click to editor then press cmd-tab twice.
      // Editor selection must be preserved.
      if (divHasFocus && !tabLostFocus) div.blur();
    }
  }, [tabLostFocus, divRef, hadFocus, hasFocus]);
}

type EditorCommand = Immutable<
  | { type: 'focus' }
  | { type: 'blur'; tabLostFocus: boolean }
  | { type: 'select'; editorSelection: EditorSelection | null }
  | { type: 'writeTextToCollapsedSelection'; path: EditorPath; text: string }
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
          draft.tabLostFocus = false;
          break;
        }

        case 'blur': {
          draft.hasFocus = false;
          draft.tabLostFocus = command.tabLostFocus;
          break;
        }

        case 'select': {
          const { editorSelection } = command;
          if (editorSelectionsAreEqual(editorSelection, draft.selection))
            return;
          draft.selection = editorSelection;
          break;
        }

        case 'writeTextToCollapsedSelection': {
          if (!invariantEditorSelectionIsDefined(draft.selection)) return;
          invariantEditorSelectionIsCollapsed(draft.selection);
          const { path, text } = command;
          // console.log(text.split('').map(char => char.charCodeAt(0)));
          const parent = getParentElementByPath(draft.element, path) as Draft<
            EditorElement
          >;
          const childIndex = path.slice(-1)[0];
          const child = parent.children[childIndex];
          if (!invariantIsEditorText(child)) return;
          const newChild = { ...child, text };
          if (editorTextsAreEqual(child, newChild)) return;
          parent.children[childIndex] = newChild;
          const offset = text.length - child.text.length;
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

export interface EditorState<T extends EditorElement = EditorDOMElement> {
  readonly element: Immutable<T>;
  readonly selection: EditorSelection | null;
  readonly hasFocus: boolean;
  readonly tabLostFocus: boolean;
}

/**
 * Create editor state. By default, the root element is EditorDOMElement.
 */
export function createEditorState<
  T extends EditorState<EditorElement> = EditorState
>({
  element,
  selection = null,
  hasFocus = false,
  tabLostFocus = false,
}: Optional<T, 'hasFocus' | 'selection' | 'tabLostFocus'>): T {
  return { element, selection, hasFocus, tabLostFocus } as T;
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
  editorState: EditorState<T>;
  onChange: (editorState: EditorState<T>) => void;
  renderElement?: RenderEditorElement;
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
  const nodesEditorPathsMap = useRef<NodesEditorPathsMap>(new Map()).current;
  const editorPathsNodesMap = useRef<EditorPathsNodesMap>(new Map()).current;

  const setNodeEditorPath = useCallback<SetNodeEditorPath>(
    (operation, node, path) => {
      switch (operation) {
        case 'add': {
          nodesEditorPathsMap.set(node, path);
          editorPathsNodesMap.set(path.join(), node);
          break;
        }
        case 'remove': {
          nodesEditorPathsMap.delete(node);
          editorPathsNodesMap.delete(path.join());
          break;
        }
        default:
          assertNever(operation);
      }
    },
    [editorPathsNodesMap, nodesEditorPathsMap],
  );

  useDebugNodesEditorPaths(nodesEditorPathsMap, editorState);
  useInvariantEditorElementIsNormalized(editorState.element);

  useEditorStateHasFocusOnDiv(
    editorState.hasFocus,
    divRef,
    editorState.tabLostFocus,
  );

  const command = useEditorCommand<T>(editorState, onChange);

  const getSelection = useCallback((): Selection | null => {
    const doc = divRef.current && divRef.current.ownerDocument;
    return doc && doc.getSelection();
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
  // I suppose this is the case for "progressively enhancing hooks".
  // https://github.com/facebook/react/issues/14927
  (isSSR ? useEffect : useLayoutEffect)(() => {
    if (!editorState.hasFocus) return;
    ensureSelectionMatchesEditorSelection();
  }, [ensureSelectionMatchesEditorSelection, editorState.hasFocus]);

  const findPathFromNode = useCallback(
    (node: Node): EditorPath => {
      const path = nodesEditorPathsMap.get(node);
      // Watch when it happens, maybe force rerender via key as Draft does that.
      if (path == null) {
        invariant(
          false,
          'MutationObserver characterData target is not in nodesEditorPathsMap.',
        );
        // @ts-ignore It will never happen because invariant throws.
        return;
      }
      return path;
    },
    [nodesEditorPathsMap],
  );

  useEffect(() => {
    if (divRef.current == null) return;
    // The idea is to let browsers to do their things for typing and backspacing text.
    // It's neccessary for IME anyway, as described in DraftJS and ProseMirror.
    // This approach ensures iOS special typing like double space etc works out of the box.
    // https://github.com/facebook/draft-js/blob/master/src/component/handlers/composition/DOMObserver.js#L103
    const observer = new MutationObserver(mutationRecords => {
      // console.log(mutationRecords);
      // // // if (mutationRecords[6]) {
      // // //   console.log(mutationRecords[6].removedNodes[0]);
      // // // }

      mutationRecords.forEach(mutationRecord => {
        if (mutationRecord.type === 'characterData') {
          const path = findPathFromNode(mutationRecord.target);
          const text = mutationRecord.target.nodeValue || '';
          // Ignore, because it must be handled via childList.
          if (text.length === 0) return;
          // EditTextRenderer checks DOM and if text is already updated, it will skip.
          command({ type: 'writeTextToCollapsedSelection', path, text });
        } else if (mutationRecord.type === 'childList') {
          // Browsers remove text node in order to inject BR instead.
          const textNodeWasRemoved =
            mutationRecord.removedNodes &&
            mutationRecord.removedNodes.length === 1 &&
            mutationRecord.removedNodes[0].nodeType === Node.TEXT_NODE;
          if (!textNodeWasRemoved) return;
          // console.log(mutationRecord);
          const path = findPathFromNode(mutationRecord.removedNodes[0]);
          // setNodeEditorPath('remove', mutationRecord.removedNodes[0] as Text, path)
          // setNodeEditorPath('add', mutationRecord.removedNodes[0] as Text, path)
          command({ type: 'writeTextToCollapsedSelection', path, text: '' });
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
  }, [command, findPathFromNode, nodesEditorPathsMap]);

  const children = useMemo(() => {
    return (
      <SetNodeEditorPathContext.Provider value={setNodeEditorPath}>
        <RenderEditorElementContext.Provider
          value={renderElement || renderEditorDOMElement}
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
    const tabLostFocus =
      (divRef.current &&
        divRef.current.ownerDocument &&
        divRef.current.ownerDocument.activeElement === divRef.current) ||
      false;
    command({ type: 'blur', tabLostFocus });
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
