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
import Debug from 'debug';
import { SetNodeEditorPathContext } from '../contexts/SetNodeEditorPathContext';
import { EditorElementRenderer } from './EditorElementRenderer';
import { RenderEditorElementContext } from '../contexts/RenderEditorElementContext';
import {
  selectionToEditorSelection,
  editorSelectionsAreEqual,
  editorSelectionIsForward,
} from '../models/selection';
import { RenderEditorElement, EditorElement } from '../models/element';
import { usePrevious } from '../hooks/usePrevious';
import { useInvariantEditorElementIsNormalized } from '../hooks/useInvariantEditorElementIsNormalized';
import { EditorPath } from '../models/path';
import { useDebugNodesEditorPaths } from '../hooks/editor/useDebugNodesEditorPaths';
import { EditorState, editorStatesAreEqual } from '../models/state';
import {
  editorReducer as defaultEditorReducer,
  EditorReducer,
} from '../reducers/editorReducer';
import { useNodesEditorPaths } from '../hooks/editor/useNodesEditorPaths';
import { renderEditorReactElement } from './EditorServer';
import { useReducerWithLogger } from '../hooks/useReducerWithLogger';
import { useBeforeInput } from '../hooks/editor/useBeforeInput';

const debugEditorAction = Debug('editor:action');

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
  // Inner state is required because of IME etc. intermediate states.
  const [editorStateWithEditorElementType, dispatch] = useReducerWithLogger(
    useReducer(editorReducer, parentEditorState),
    debugEditorAction,
  );
  // I don't know how to pass T to useReducer and editorReducer properly.
  // That's why we cast editorState once for all here.
  const editorState = editorStateWithEditorElementType as EditorState<T>;

  const {
    nodesEditorPathsMap,
    editorPathsNodesMap,
    setNodeEditorPath,
  } = useNodesEditorPaths();

  useInvariantEditorElementIsNormalized(editorState.element);
  useDebugNodesEditorPaths(nodesEditorPathsMap, editorState.element);

  const divRef = useRef<HTMLDivElement>(null);

  // Internal states.
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
      const selection = selectionToEditorSelection(
        getSelection(),
        nodesEditorPathsMap,
      );
      // Editor must remember the last selection when document selection
      // is moved elsewhere to restore it later on focus.
      // In Chrome, contentEditable does not do that.
      // That's why we ignore null values.
      if (selection == null) return;
      dispatch({ type: 'selectionChange', selection });
    };
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [dispatch, getSelection, nodesEditorPathsMap]);

  const ensureSelectionMatchesEditorSelection = useCallback(() => {
    const selection = getSelection();
    if (selection == null) return;
    const currentSelection = selectionToEditorSelection(
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

    const isForward = editorSelectionIsForward(editorState.selection);

    const [startNode, startOffset] = editorPathToNodeOffset(
      isForward ? editorState.selection.anchor : editorState.selection.focus,
    );
    const [endNode, endOffset] = editorPathToNodeOffset(
      isForward ? editorState.selection.focus : editorState.selection.anchor,
    );

    if (startNode == null || endNode == null) return;

    const range = doc.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    selection.removeAllRanges();
    if (isForward) {
      selection.addRange(range);
    } else {
      // https://stackoverflow.com/a/4802994/233902
      const endRange = range.cloneRange();
      endRange.collapse(false);
      selection.addRange(endRange);
      selection.extend(range.startContainer, range.startOffset);
    }
  }, [
    getSelection,
    nodesEditorPathsMap,
    editorState.selection,
    editorPathsNodesMap,
  ]);

  // useLayoutEffect is must to keep browser selection in sync with editor state.
  // TODO: Do we still need it?
  useLayoutEffect(() => {
    if (!editorState.hasFocus) return;
    ensureSelectionMatchesEditorSelection();
  }, [ensureSelectionMatchesEditorSelection, editorState.hasFocus]);

  useBeforeInput(divRef, nodesEditorPathsMap, dispatch);

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
    dispatch({ type: 'focus' });
  }, [dispatch, ensureSelectionMatchesEditorSelection]);

  const handleDivBlur = useCallback(() => {
    const tabLostFocus =
      (divRef.current &&
        divRef.current.ownerDocument &&
        divRef.current.ownerDocument.activeElement === divRef.current) ||
      false;
    setTabLostFocus(tabLostFocus);
    dispatch({ type: 'blur' });
  }, [dispatch]);

  // Sync inner editor state with outer.
  const lastParentEditorStateRef = useRef<EditorState<T> | null>(null);
  useLayoutEffect(() => {
    lastParentEditorStateRef.current = parentEditorState;
  }, [parentEditorState]);
  useLayoutEffect(() => {
    if (!editorStatesAreEqual(editorState, lastParentEditorStateRef.current))
      onChange(editorState);
  }, [editorState, onChange]);

  // Sync outer editor state with inner.
  const editorStateRef = useRef<EditorState<T>>(editorState);
  useLayoutEffect(() => {
    editorStateRef.current = editorState;
  }, [editorState]);
  // We can not just override editorState, because that could override meanwhile
  // updated state props. That's why we use one effect per one prop.
  useLayoutEffect(() => {
    if (parentEditorState.element === editorStateRef.current.element) return;
    dispatch({
      type: 'setEditorStatePartial',
      change: { element: parentEditorState.element },
    });
  }, [dispatch, parentEditorState.element]);
  useLayoutEffect(() => {
    if (parentEditorState.hasFocus === editorStateRef.current.hasFocus) return;
    dispatch({
      type: 'setEditorStatePartial',
      change: { hasFocus: parentEditorState.hasFocus },
    });
  }, [dispatch, parentEditorState.hasFocus]);
  useLayoutEffect(() => {
    if (parentEditorState.selection === editorStateRef.current.selection)
      return;
    dispatch({
      type: 'setEditorStatePartial',
      change: { selection: parentEditorState.selection },
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
