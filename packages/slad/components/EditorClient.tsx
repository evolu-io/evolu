/* eslint-env browser */
import React, {
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useState,
  useReducer,
  useLayoutEffect,
} from 'react';
import invariant from 'tiny-invariant';
import Debug from 'debug';
import { SetNodeEditorPathContext } from '../contexts/SetNodeEditorPathContext';
import { EditorElementRenderer } from './EditorElementRenderer';
import { RenderEditorElementContext } from '../contexts/RenderEditorElementContext';
import {
  mapSelectionToEditorSelection,
  editorSelectionsAreEqual,
  editorSelectionIsBackward,
} from '../models/selection';
import { RenderEditorElement, EditorElement } from '../models/element';
import { usePrevious } from '../hooks/usePrevious';
import { useInvariantEditorElementIsNormalized } from '../hooks/useInvariantEditorElementIsNormalized';
import { EditorPath } from '../models/path';
import { useDebugNodesEditorPaths } from '../hooks/useDebugNodesEditorPaths';
import { EditorState, editorStatesAreEqual } from '../models/state';
import {
  editorReducer as defaultEditorReducer,
  EditorReducer,
} from '../reducers/editorReducer';
import { useNodesEditorPaths } from '../hooks/useNodesEditorPaths';
import { renderEditorReactElement } from './EditorServer';
import { useReducerWithLogger } from '../hooks/useReducerWithLogger';

const debug = Debug('editor');

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

export interface EditorClientProps<T extends EditorElement = EditorElement>
  extends UsefulReactDivAtttributes {
  editorState: EditorState<T>;
  onChange: (editorState: EditorState<T>) => void;
  renderElement?: RenderEditorElement;
  editorReducer?: EditorReducer<EditorElement>;
}

export function EditorClient<T extends EditorElement>({
  editorState: parentEditorState,
  onChange,
  renderElement,
  editorReducer = defaultEditorReducer,
  autoCorrect = 'off',
  spellCheck = false,
  role = 'textbox',
  ...rest
}: EditorClientProps<T>) {
  const [editorState, dispatch] = useReducerWithLogger(
    useReducer(editorReducer, parentEditorState),
    debug,
  );

  const {
    nodesEditorPathsMap,
    editorPathsNodesMap,
    setNodeEditorPath,
  } = useNodesEditorPaths();

  useInvariantEditorElementIsNormalized(editorState.element);
  useDebugNodesEditorPaths(nodesEditorPathsMap, editorState.element);

  const divRef = useRef<HTMLDivElement>(null);

  const [tabLostFocus, setTabLostFocus] = useState(false);

  const editorStateHadFocus = usePrevious(editorState.hasFocus);

  // Map editor declarative focus to imperative DOM focus and blur methods.
  useEffect(() => {
    const { current: div } = divRef;
    if (div == null) return;
    const divHasFocus =
      div === (div.ownerDocument && div.ownerDocument.activeElement);
    if (!editorStateHadFocus && editorState.hasFocus) {
      if (!divHasFocus) div.focus();
    } else if (editorStateHadFocus && !editorState.hasFocus) {
      // Do not call blur when tab lost focus so editor can be focused back.
      // For visual test, click to editor then press cmd-tab twice.
      // Editor selection must be preserved.
      if (divHasFocus && !tabLostFocus) div.blur();
    }
  }, [tabLostFocus, divRef, editorStateHadFocus, editorState.hasFocus]);

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
      dispatch({ type: 'onSelectionChange', selection: editorSelection });
    };
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [dispatch, getSelection, nodesEditorPathsMap]);

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
  useLayoutEffect(() => {
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
    const observer = new MutationObserver(mutations => {
      function onlyCharacterDataMutations(
        mutations: MutationRecord[],
      ): boolean {
        return mutations.every(mutation => mutation.type === 'characterData');
      }

      // console.log(mutations);
      // TODO: It should be list of rules, { whatHappen: predicate }

      const textWasUpdatedByTypingOrModel = onlyCharacterDataMutations(
        mutations,
      );

      if (textWasUpdatedByTypingOrModel) {
        // mutations.length could be 1 or 2
        // 2 for the whitespace, which generates two identical mutations for some reason
        // We takes the last.
        const lastMutation = mutations[mutations.length - 1];
        const path = findPathFromNode(lastMutation.target);
        const text = lastMutation.target.nodeValue || '';
        // Ignore empty text, because it must be handled via childList mutation.
        if (text.length === 0) return;
        dispatch({ type: 'onTextChange', path, text });
        return;
      }

      const textWasReplacedWithBRByTyping =
        mutations.length === 3 &&
        mutations[0].type === 'characterData' &&
        mutations[1].type === 'childList' &&
        mutations[1].removedNodes[0].nodeType === Node.TEXT_NODE &&
        mutations[2].type === 'childList' &&
        mutations[2].addedNodes[0].nodeName === 'BR';

      if (textWasReplacedWithBRByTyping) {
        const removedTextNode = mutations[1].removedNodes[0] as Text;
        const path = findPathFromNode(removedTextNode);
        setNodeEditorPath('remove', removedTextNode, path);
        dispatch({ type: 'onTextChange', path, text: '' });
        return;
      }

      // In EditorTextRenderer manually.
      const textWasReplacedWithBRByModel =
        mutations.length === 1 &&
        mutations[0].type === 'childList' &&
        mutations[0].addedNodes.length === 1 &&
        mutations[0].addedNodes[0].nodeName === 'BR' &&
        mutations[0].removedNodes.length === 1 &&
        mutations[0].removedNodes[0].nodeType === Node.TEXT_NODE;

      if (textWasReplacedWithBRByModel) {
        // setNodeEditorPath('remove', removedTextNode, path);
        // TODO: Ensure selection here?
        return;
      }

      const brWasReplacedWithTextByTyping =
        mutations[0].type === 'childList' &&
        mutations[0].addedNodes.length === 1 &&
        mutations[0].addedNodes[0].nodeType === Node.TEXT_NODE &&
        mutations[1].type === 'childList' &&
        mutations[1].removedNodes.length === 1 &&
        mutations[1].removedNodes[0].nodeName === 'BR' &&
        onlyCharacterDataMutations(mutations.slice(2));

      if (brWasReplacedWithTextByTyping) {
        const addedTextNode = mutations[0].addedNodes[0] as Text;
        const removedBR = mutations[1].removedNodes[0] as HTMLBRElement;
        const path = findPathFromNode(removedBR);
        setNodeEditorPath('remove', removedBR, path);
        setNodeEditorPath('add', addedTextNode, path);
        const text = addedTextNode.nodeValue || '';
        dispatch({ type: 'onTextChange', path, text });
        return;
      }

      // TODO: Warning?
      // eslint-disable-next-line no-console
      console.log('Unknown DOM mutation in Editor MutationObserver:');
      // eslint-disable-next-line no-console
      console.log(mutations);
      // invariant(false, 'Unknown DOM mutation in Editor MutationObserver.');
    });

    observer.observe(divRef.current, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [dispatch, findPathFromNode, setNodeEditorPath]);

  const rootPath = useMemo(() => [], []);

  const children = useMemo(() => {
    return (
      <SetNodeEditorPathContext.Provider value={setNodeEditorPath}>
        <RenderEditorElementContext.Provider
          value={renderElement || renderEditorReactElement}
        >
          <EditorElementRenderer
            element={editorState.element}
            path={rootPath}
          />
        </RenderEditorElementContext.Provider>
      </SetNodeEditorPathContext.Provider>
    );
  }, [editorState.element, renderElement, rootPath, setNodeEditorPath]);

  const handleDivFocus = useCallback(() => {
    ensureSelectionMatchesEditorSelection();
    setTabLostFocus(false);
    dispatch({ type: 'onFocus' });
  }, [dispatch, ensureSelectionMatchesEditorSelection]);

  const handleDivBlur = useCallback(() => {
    const tabLostFocus =
      (divRef.current &&
        divRef.current.ownerDocument &&
        divRef.current.ownerDocument.activeElement === divRef.current) ||
      false;
    setTabLostFocus(tabLostFocus);
    dispatch({ type: 'onBlur' });
  }, [dispatch]);

  // Sync editorState with parentEditorState conditionally per last parentEditorState.
  const lastParentEditorStateRef = useRef<EditorState<T> | null>(null);
  useLayoutEffect(() => {
    lastParentEditorStateRef.current = parentEditorState;
  }, [parentEditorState]);
  useLayoutEffect(() => {
    if (editorStatesAreEqual(editorState, lastParentEditorStateRef.current))
      return;
    onChange(editorState as EditorState<T>);
  }, [editorState, onChange]);

  // Sync parentEditorState with editorState conditionally per parentEditorState props.
  const editorStateRef = useRef<EditorState<T>>(editorState as EditorState<T>);
  useLayoutEffect(() => {
    editorStateRef.current = editorState as EditorState<T>;
  }, [editorState]);
  useLayoutEffect(() => {
    if (parentEditorState.element === editorStateRef.current.element) return;
    dispatch({
      type: 'onParentElementChange',
      element: parentEditorState.element,
    });
  }, [dispatch, parentEditorState.element]);
  useLayoutEffect(() => {
    if (parentEditorState.hasFocus === editorStateRef.current.hasFocus) return;
    dispatch({
      type: 'onParentHasFocusChange',
      hasFocus: parentEditorState.hasFocus,
    });
  }, [dispatch, parentEditorState.hasFocus]);
  useLayoutEffect(() => {
    if (parentEditorState.selection === editorStateRef.current.selection)
      return;
    dispatch({
      type: 'onParentSelectionChange',
      selection: parentEditorState.selection,
    });
  }, [dispatch, parentEditorState.selection]);

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
        suppressHydrationWarning
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
